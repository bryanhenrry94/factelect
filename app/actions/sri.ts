"use server";
import { prisma } from "@/lib/prisma";
import { generateXmlSRI } from "./sri-document";
import { firmarFactura } from "./firma";
import { getXmlSignedByPath } from "./supabase";
import { enviarComprobanteAlSRI } from "./sri-recepcion";
import { consultarAutorizacionSRI } from "./sri-autorizacion";

export async function sendToSRI(
  invoiceId: string,
  tenantId: string
): Promise<{
  success: boolean;
  authorizationNumber?: string;
  authorizationDate?: Date;
  error?: string;
}> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { sriConfig: true },
    });

    if (!tenant) throw new Error("Tenant no encontrado");
    if (!tenant.sriConfig)
      throw new Error("Configuración del SRI no encontrada");

    const { p12CertificateUrl, certificatePassword, sriEnvironment } =
      tenant.sriConfig;
    if (!p12CertificateUrl || !certificatePassword)
      throw new Error("Certificado SRI no configurado correctamente");

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        customer: true,
        emissionPoint: { include: { establishment: true } },
        taxes: true,
        items: { include: { product: true } },
        paymentMethods: true,
      },
    });

    if (!invoice) throw new Error("Factura no encontrada");

    // ===============================================
    // 🧩 1. Generar XML y firmar si está en DRAFT
    // ===============================================
    let xmlSigned: {
      success: boolean;
      xmlContent?: string;
      xmlFilePath?: string;
      xmlFileUrl?: string;
      error?: string;
    } = { success: false };

    if (invoice.status === "DRAFT") {
      const xmlResult = await generateXmlSRI(invoiceId);
      if (!xmlResult.success || !xmlResult.xml)
        throw new Error(xmlResult.error || "Error al generar XML");

      const responseSigned = await firmarFactura({
        certUrl: p12CertificateUrl,
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

      if (!responseSigned.success)
        throw new Error(responseSigned.error || "Error al firmar XML");

      // Extraer clave de acceso del XML firmado
      const accessKeyMatch = responseSigned.xmlSigned?.match(
        /<claveAcceso>(\d+)<\/claveAcceso>/
      );
      const accessKey = accessKeyMatch ? accessKeyMatch[1] : null;
      if (!accessKey)
        throw new Error("Clave de acceso no encontrada en el XML firmado");

      // Asignar clave de acceso a la factura en memoria para uso posterior
      invoice.accessKey = accessKey;

      // Guardar estado firmado
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          xmlFilePath: responseSigned.xmlFilePath,
          xmlFileUrl: responseSigned.xmlFileUrl,
          status: "SIGNED",
          accessKey,
        },
      });

      xmlSigned = {
        success: true,
        xmlContent: responseSigned.xmlSigned,
        xmlFilePath: responseSigned.xmlFilePath,
        xmlFileUrl: responseSigned.xmlFileUrl,
      };
    }

    // ===============================================
    // 🧩 2. Si ya está firmado, obtener XML
    // ===============================================
    if (invoice.status === "SIGNED") {
      const resDownloadXml = await getXmlSignedByPath(invoice.xmlFilePath!);
      if (!resDownloadXml.success || !resDownloadXml.xmlSigned)
        throw new Error(resDownloadXml.error || "Error al obtener XML firmado");

      xmlSigned = {
        success: true,
        xmlContent: resDownloadXml.xmlSigned,
        xmlFilePath: invoice.xmlFilePath!,
        xmlFileUrl: invoice.xmlFileUrl!,
      };
    }

    // ===============================================
    // 🧩 3. Enviar al SRI (Recepción)
    // ===============================================
    const resSriRecep = await enviarComprobanteAlSRI(
      xmlSigned.xmlContent || "",
      sriEnvironment as "1" | "2"
    );

    console.log("Respuesta SRI Recepción:", resSriRecep);

    if (!resSriRecep.success) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PENDING_AUTHORIZATION",
          sriResponse: JSON.stringify(resSriRecep.raw || resSriRecep),
          sriError: resSriRecep.error,
        },
      });
      throw new Error("Error en la recepción del SRI: " + resSriRecep.error);
    }

    if (resSriRecep.estado !== "RECIBIDA") {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PENDING_AUTHORIZATION",
          sriResponse: JSON.stringify(resSriRecep.raw || resSriRecep),
        },
      });
      throw new Error(
        `Factura no recibida por el SRI. Estado: ${resSriRecep.estado}`
      );
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    });

    // Espera unos segundos antes de autorizar
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // ===============================================
    // 🧩 4. Consultar autorización
    // ===============================================
    const resSriAuth = await consultarAutorizacionSRI(
      invoice.accessKey!,
      sriEnvironment as "1" | "2"
    );

    console.log("Respuesta SRI Autorización:", resSriAuth);

    if (!resSriAuth.success) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PENDING_AUTHORIZATION",
          sriResponse: JSON.stringify(resSriAuth.raw || resSriAuth),
          sriError: resSriAuth.error,
        },
      });
      throw new Error("Error al consultar autorización: " + resSriAuth.error);
    }

    if (resSriAuth.estado !== "AUTORIZADO") {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PENDING_AUTHORIZATION",
          sriResponse: JSON.stringify(resSriAuth.raw || resSriAuth),
        },
      });
      throw new Error(`Factura no autorizada. Estado: ${resSriAuth.estado}`);
    }

    // ===============================================
    // 🧩 5. Factura AUTORIZADA ✅
    // ===============================================
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "AUTHORIZED",
        authorizationNumber: resSriAuth.numeroAutorizacion || "",
        authorizationDate: resSriAuth.fechaAutorizacion
          ? new Date(resSriAuth.fechaAutorizacion)
          : null,
        sriResponse: JSON.stringify(resSriAuth.raw),
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
    console.error(
      "❌ Error al autorizar la factura con el SRI:",
      error.message
    );

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PENDING_AUTHORIZATION",
        sriError: error.message,
      },
    });

    return {
      success: false,
      error: error.message || "Error general en el proceso de autorización",
    };
  }
}

export async function retryPendingAuthorizations() {
  const pendingInvoices = await prisma.invoice.findMany({
    where: { status: "PENDING_AUTHORIZATION" },
  });

  for (const invoice of pendingInvoices) {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: invoice.tenantId },
        include: { sriConfig: true },
      });

      if (!tenant?.sriConfig) continue;

      const resAuth = await consultarAutorizacionSRI(
        invoice.accessKey!,
        tenant.sriConfig.sriEnvironment as "1" | "2"
      );

      console.log(
        `Reintentando autorización para factura ${invoice.id}:`,
        resAuth
      );

      if (resAuth.success && resAuth.estado === "AUTORIZADO") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "AUTHORIZED",
            authorizationNumber: resAuth.numeroAutorizacion || "",
            authorizationDate: resAuth.fechaAutorizacion
              ? new Date(resAuth.fechaAutorizacion)
              : null,
            sriResponse: JSON.stringify(resAuth.raw),
          },
        });
      } else if (resAuth.success && resAuth.estado === "NO AUTORIZADO") {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "REJECTED",
            sriResponse: JSON.stringify(resAuth.raw || resAuth),
            sriError: resAuth.error || null,
          },
        });
        console.log(`Factura ${invoice.id} no autorizada por el SRI.`);
      } else {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            sriResponse: JSON.stringify(resAuth.raw || resAuth),
            sriError: resAuth.error || null,
          },
        });
        console.log(
          `Factura ${invoice.id} aún no autorizada. Estado: ${resAuth.estado}`
        );
      }
    } catch (err) {
      console.error("❌ Error reintentando autorización:", err);
    }
  }
}
