"use server";
import { prisma } from "@/lib/prisma";
import { generateXmlSRI } from "./sri-document";
import { firmarFactura } from "./firma";
import { getXmlSignedByPath } from "@/actions/supabase";
import { enviarComprobanteAlSRI } from "./sri-recepcion";
import { consultarAutorizacionSRI } from "./sri-autorizacion";

export async function sendToSRI(
  documentId: string,
  tenantId: string
): Promise<{
  success: boolean;
  authorizationNumber?: string;
  authorizationDate?: Date;
  error?: string;
}> {
  try {
    // ===============================================
    // 🧩 0. Obtener tenant y config SRI
    // ===============================================
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { sriConfiguration: true },
    });

    if (!tenant) throw new Error("Tenant no encontrado");
    if (!tenant.sriConfiguration)
      throw new Error("Configuración del SRI no encontrada");

    const { certificateUrl, certificatePassword, environment } =
      tenant.sriConfiguration;

    if (!certificateUrl || !certificatePassword)
      throw new Error("Certificado SRI no configurado correctamente");

    // ===============================================
    // 🧩 1. Obtener documento
    // ===============================================
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        tenant: true,
        person: true,
        documentFiscalInfo: {
          include: { establishment: true, emissionPoint: true },
        },
        taxes: true,
        items: { include: { product: true } },
        documentPayments: true,
      },
    });

    if (!document) throw new Error("Factura no encontrada");
    if (!document.documentFiscalInfo)
      throw new Error("Información fiscal no encontrada");

    const fiscalInfo = document.documentFiscalInfo;

    // ===============================================
    // 🧩 2. Generar y firmar XML si está en DRAFT
    // ===============================================
    let xmlSigned: string | null = null;

    if (fiscalInfo.sriStatus === "DRAFT") {
      const xmlResult = await generateXmlSRI(documentId);
      if (!xmlResult.success || !xmlResult.xml)
        throw new Error(xmlResult.error || "Error al generar XML");

      const responseSigned = await firmarFactura({
        certUrl: certificateUrl,
        certPassword: certificatePassword,
        xmlDocument: xmlResult.xml,
        tenantId: tenant.id,
      });

      if (
        responseSigned.error?.includes("Keystore") ||
        responseSigned.error?.includes("password")
      ) {
        throw new Error("Contraseña del certificado incorrecta");
      }

      if (!responseSigned.success || !responseSigned.xmlSigned)
        throw new Error(responseSigned.error || "Error al firmar XML");

      const accessKeyMatch = responseSigned.xmlSigned.match(
        /<claveAcceso>(\d+)<\/claveAcceso>/
      );
      const accessKey = accessKeyMatch?.[1];
      fiscalInfo.accessKey = accessKey || null;

      if (!accessKey)
        throw new Error("Clave de acceso no encontrada en el XML firmado");

      await prisma.documentFiscalInfo.update({
        where: { documentId },
        data: {
          accessKey,
          generatedXmlUrl: responseSigned.xmlFileUrl,
          generatedXmlPath: responseSigned.xmlFilePath,
          sriStatus: "DRAFT", // sigue en borrador pero ya firmado
        },
      });

      xmlSigned = responseSigned.xmlSigned;
    }

    // ===============================================
    // 🧩 3. Si ya fue generado antes, descargar XML
    // ===============================================
    if (!xmlSigned && fiscalInfo.generatedXmlPath) {
      const resDownloadXml = await getXmlSignedByPath(
        fiscalInfo.generatedXmlPath
      );

      if (!resDownloadXml.success || !resDownloadXml.xmlSigned)
        throw new Error(resDownloadXml.error || "Error al obtener XML firmado");

      xmlSigned = resDownloadXml.xmlSigned;
    }

    if (!xmlSigned) throw new Error("No se pudo obtener el XML firmado");

    // ===============================================
    // 🧩 4. Enviar a recepción SRI si aún no se ha enviado
    // ===============================================
    if (
      fiscalInfo.sriStatus === "DRAFT" ||
      fiscalInfo.sriStatus === "REJECTED"
    ) {
      const resSriRecep = await enviarComprobanteAlSRI(
        xmlSigned,
        environment === "TEST" ? "1" : "2"
      );

      console.log("📨 Respuesta SRI Recepción:", resSriRecep);

      if (!resSriRecep.success) {
        await prisma.documentFiscalInfo.update({
          where: { documentId },
          data: {
            sriStatus: "SENT",
            rawResponse: JSON.stringify(resSriRecep.raw),
          },
        });
        throw new Error("Error en recepción SRI: " + (resSriRecep.error || ""));
      }

      if (resSriRecep.estado === "DEVUELTA") {
        await prisma.documentFiscalInfo.update({
          where: { documentId },
          data: {
            sriStatus: "REJECTED",
            rawResponse: JSON.stringify(resSriRecep.raw),
          },
        });
        throw new Error("Factura devuelta por el SRI");
      }

      if (resSriRecep.estado !== "RECIBIDA") {
        await prisma.documentFiscalInfo.update({
          where: { documentId },
          data: {
            sriStatus: "REJECTED",
            rawResponse: JSON.stringify(resSriRecep.raw),
          },
        });
        throw new Error(
          `Factura no recibida por el SRI. Estado: ${resSriRecep.estado}`
        );
      }

      await prisma.documentFiscalInfo.update({
        where: { documentId },
        data: {
          sriStatus: "RECEIVED",
        },
      });
    }

    // ===============================================
    // 🧩 5. Consultar autorización
    // ===============================================
    await prisma.documentFiscalInfo.update({
      where: { documentId },
      data: { sriStatus: "IN_PROCESS" },
    });

    const resSriAuth = await consultarAutorizacionSRI(
      fiscalInfo.accessKey!,
      environment === "TEST" ? "1" : "2"
    );

    console.log("📬 Respuesta SRI Autorización:", resSriAuth);

    if (!resSriAuth.success) {
      await prisma.documentFiscalInfo.update({
        where: { documentId },
        data: {
          sriStatus: "IN_PROCESS",
          rawResponse: JSON.stringify(resSriAuth.raw),
        },
      });

      return {
        success: false,
        error:
          resSriAuth.error ||
          "El SRI aún no ha emitido una respuesta de autorización",
      };
    }

    if (resSriAuth.estado === "NO DISPONIBLE") {
      await prisma.documentFiscalInfo.update({
        where: { documentId },
        data: { sriStatus: "IN_PROCESS" },
      });

      return {
        success: false,
        error: "El SRI aún no ha procesado la autorización. Reintentar luego.",
      };
    }

    if (resSriAuth.estado !== "AUTORIZADO") {
      await prisma.documentFiscalInfo.update({
        where: { documentId },
        data: {
          sriStatus: "REJECTED",
          rawResponse: JSON.stringify(resSriAuth.raw),
        },
      });

      throw new Error(`Factura no autorizada. Estado: ${resSriAuth.estado}`);
    }

    // ===============================================
    // 🧩 6. AUTORIZADA ✅
    // ===============================================
    await prisma.documentFiscalInfo.update({
      where: { documentId },
      data: {
        sriStatus: "AUTHORIZED",
        authorization: resSriAuth.numeroAutorizacion || "",
        authorizationDate: resSriAuth.fechaAutorizacion
          ? new Date(resSriAuth.fechaAutorizacion)
          : null,
      },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "CONFIRMED",
      },
    });

    return {
      success: true,
      authorizationNumber: resSriAuth.numeroAutorizacion || "",
      authorizationDate: resSriAuth.fechaAutorizacion
        ? new Date(resSriAuth.fechaAutorizacion)
        : undefined,
    };
  } catch (error: any) {
    console.error("❌ Error en proceso SRI:", error.message);

    return {
      success: false,
      error: error.message || "Error general en el proceso con el SRI",
    };
  }
}

export async function retryPendingAuthorizations() {
  const pendingDocuments = await prisma.documentFiscalInfo.findMany({
    where: { sriStatus: "IN_PROCESS" },
    include: { document: true },
  });

  for (const document of pendingDocuments) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: document.document.tenantId },
        include: { sriConfiguration: true },
      });

      if (!tenant?.sriConfiguration) continue;

      const resAuth = await consultarAutorizacionSRI(
        document.accessKey!,
        tenant.sriConfiguration.environment as "1" | "2"
      );

      console.log(
        `Reintentando autorización para factura ${document.id}:`,
        resAuth
      );

      if (resAuth.success && resAuth.estado === "AUTORIZADO") {
        await prisma.documentFiscalInfo.update({
          where: { id: document.id },
          data: {
            sriStatus: "AUTHORIZED",
            authorization: resAuth.numeroAutorizacion || "",
            authorizationDate: resAuth.fechaAutorizacion
              ? new Date(resAuth.fechaAutorizacion)
              : null,
          },
        });
      } else if (resAuth.success && resAuth.estado === "NO AUTORIZADO") {
        await prisma.documentFiscalInfo.update({
          where: { id: document.id },
          data: {
            sriStatus: "REJECTED",
          },
        });
        console.log(`Factura ${document.id} no autorizada por el SRI.`);
      } else {
        await prisma.documentFiscalInfo.update({
          where: { id: document.id },
          data: {
            sriStatus: "AUTHORIZED",
          },
        });
        console.log(
          `Factura ${document.id} aún no autorizada. Estado: ${resAuth.estado}`
        );
      }
    } catch (err) {
      console.error("❌ Error reintentando autorización:", err);
    }
  }
}
