"use server";
import { prisma } from "@/lib/prisma";
import { generateXmlSRI } from "./sri-document";
import { sriUrls } from "@/constants/sri";
import { firmarFactura } from "./firma";
import axios from "axios";

export async function sendToSRI(
  invoiceId: string,
  tenantId: string
): Promise<{
  success: boolean;
  authorizationCode?: string;
  error?: string;
}> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        sriConfig: true,
      },
    });

    if (!tenant) {
      throw new Error("Error de configuración del tenant");
    }

    if (!tenant.sriConfig) {
      throw new Error("Error de configuración del SRI para el tenant");
    }

    if (
      !tenant.sriConfig.p12CertificateUrl ||
      !tenant.sriConfig.certificatePassword
    ) {
      throw new Error("Error de configuración del certificado SRI");
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        customer: true,
        emissionPoint: {
          include: { establishment: true },
        },
        taxes: true,
        items: {
          include: { product: true },
        },
        paymentMethods: true,
      },
    });

    if (!invoice) {
      throw new Error("Factura no encontrada");
    }

    // 1. Construir el XML del comprobante electrónico según las especificaciones del SRI
    const xmlResult = await generateXmlSRI(invoiceId);
    if (!xmlResult.success || !xmlResult.xml) {
      throw new Error(xmlResult.error || "Error al generar XML");
    }

    // 2. Firmar el XML digitalmente usando el certificado P12
    const parameters = {
      certUrl: tenant.sriConfig.p12CertificateUrl,
      certPassword: tenant.sriConfig.certificatePassword,
      xmlDocument: xmlResult.xml,
      tenantId: tenant.id,
    };

    const xmlSigned = await firmarFactura(parameters);
    if (
      !xmlSigned.success ||
      !xmlSigned.xmlSigned ||
      !xmlSigned.xmlFilePath ||
      !xmlSigned.xmlFileUrl
    ) {
      throw new Error(xmlSigned.error || "Error al firmar XML");
    }

    // Actualizar la factura con la información del XML firmado
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        xmlFilePath: xmlSigned.xmlFilePath,
        xmlFileUrl: xmlSigned.xmlFileUrl,
        status: "SIGNED",
      },
    });

    // 3. Subir el XML firmado al SRI para su validación
    const urlRecepcionSRI =
      tenant.sriConfig.sriEnvironment === "1"
        ? sriUrls.sandbox.recepcion
        : sriUrls.produccion.recepcion;

    // Convertir XML a base64 como requiere el WSDL
    // const xmlBase64 = Buffer.from(xmlSigned.xmlSigned).toString("base64");

    const xmlContent = xmlSigned.xmlSigned
      .replace(/<\?xml.*?\?>/, "") // elimina la cabecera XML
      .trim();

    const xmlSoap = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns:ws="http://ec.gob.sri.ws.recepcion">
      <soapenv:Header/>
      <soapenv:Body>
        <ws:validarComprobante>
          <ws:xml><![CDATA[${xmlSigned.xmlSigned}]]></ws:xml>
        </ws:validarComprobante>
      </soapenv:Body>
    </soapenv:Envelope>`;

    console.log("XML SOAP to SRI:", xmlContent);

    const { data } = await axios.post(
      "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline",
      xmlSoap,
      {
        headers: {
          "Content-Type": "text/xml;charset=UTF-8",
          SOAPAction: "",
        },
        timeout: 15000, // opcional, evita cuelgues
      }
    );

    console.log("SRI Response Data:", data);

    // // Enviar solicitud SOAP al SRI
    // const response = await fetch(urlRecepcionSRI, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "text/xml; charset=utf-8",
    //     SOAPAction: "",
    //   },
    //   body: soapEnvelope,
    // });

    // console.log("SRI Response Status:", response);

    // if (!response.ok) {
    //   throw new Error(
    //     `Error en el servicio SRI: ${response.status} ${response.statusText}`
    //   );
    // }

    // const responseText = await response.text();

    // // Parse the SOAP response (simplified parsing)
    // // In production, you should use a proper XML parser
    // const isSuccess = responseText.includes("<estado>RECIBIDA</estado>");

    // if (!isSuccess) {
    //   // Parse SRI error response
    //   const estadoMatch = responseText.match(/<estado>(.*?)<\/estado>/);
    //   const estado = estadoMatch ? estadoMatch[1] : "UNKNOWN";

    //   const mensajeMatch = responseText.match(/<mensaje>(.*?)<\/mensaje>/);
    //   const mensaje = mensajeMatch ? mensajeMatch[1] : "Unknown error from SRI";

    //   const informacionMatch = responseText.match(
    //     /<informacionAdicional>(.*?)<\/informacionAdicional>/
    //   );
    //   const informacionAdicional = informacionMatch ? informacionMatch[1] : "";

    //   const tipoMatch = responseText.match(/<tipo>(.*?)<\/tipo>/);
    //   const tipo = tipoMatch ? tipoMatch[1] : "ERROR";

    //   const sriResponse = {
    //     estado,
    //     mensaje,
    //     informacionAdicional,
    //     tipo,
    //     fullResponse: responseText,
    //   };

    //   await prisma.invoice.update({
    //     where: { id: invoiceId },
    //     data: {
    //       status: "REJECTED",
    //       sriResponse: JSON.stringify(sriResponse),
    //     },
    //   });

    //   throw new Error(`SRI rechazó la factura: ${mensaje}`);
    // }

    // // Actualizar el estado de la factura a SENT
    // await prisma.invoice.update({
    //   where: { id: invoiceId },
    //   data: {
    //     status: "SENT",
    //   },
    // });

    // // espera unos segundos antes de consultar
    // await new Promise((resolve) => setTimeout(resolve, 5000));

    // // 4. Consultar la autorización del comprobante
    // const urlAutorizacionSRI =
    //   tenant.sriConfig.sriEnvironment === "1"
    //     ? sriUrls.sandbox.autorizacion
    //     : sriUrls.produccion.autorizacion;

    // const accessKey = xmlResult.xml.match(
    //   /<claveAcceso>(.*?)<\/claveAcceso>/
    // )?.[1]; // La clave de acceso generada previamente

    // const authSoapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
    // <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:aut="http://ec.gob.sri.ws.autorizacion">
    //   <soap:Header/>
    //   <soap:Body>
    //     <aut:autorizacionComprobante>
    //       <aut:claveAccesoComprobante>${accessKey}</aut:claveAccesoComprobante>
    //     </aut:autorizacionComprobante>
    //   </soap:Body>
    // </soap:Envelope>`;

    // const authResponse = await fetch(urlAutorizacionSRI, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "text/xml; charset=utf-8",
    //     SOAPAction: "",
    //   },
    //   body: authSoapEnvelope,
    // });

    // if (!authResponse.ok) {
    //   throw new Error(
    //     `Error en el servicio de autorización SRI: ${authResponse.status} ${authResponse.statusText}`
    //   );
    // }

    // const authResponseText = await authResponse.text();

    // // Simplified parsing of the authorization response
    // const isAuthorized = authResponseText.includes(
    //   "<estado>AUTORIZADO</estado>"
    // );

    // if (!isAuthorized) {
    //   const estadoMatch = authResponseText.match(/<estado>(.*?)<\/estado>/);
    //   const estado = estadoMatch ? estadoMatch[1] : "UNKNOWN";

    //   const mensajeMatch = authResponseText.match(/<mensaje>(.*?)<\/mensaje>/);
    //   const mensaje = mensajeMatch ? mensajeMatch[1] : "Unknown error from SRI";

    //   await prisma.invoice.update({
    //     where: { id: invoiceId },
    //     data: {
    //       status: "REJECTED",
    //       sriResponse: JSON.stringify({
    //         estado,
    //         mensaje,
    //         fullResponse: authResponseText,
    //       }),
    //     },
    //   });

    //   throw new Error("Factura no autorizada por el SRI");
    // }

    // // Extraer el número de autorización y la fecha
    // const authorizationNumber = authResponseText.match(
    //   /<numeroAutorizacion>(.*?)<\/numeroAutorizacion>/
    // )?.[1];

    // if (!authorizationNumber) {
    //   throw new Error("Authorization number not found in SRI response");
    // }

    // const authorizationDateStr = authResponseText.match(
    //   /<fechaAutorizacion>(.*?)<\/fechaAutorizacion>/
    // )?.[1];

    // let authorizationDate: Date | null = null;
    // if (authorizationDateStr) {
    //   authorizationDate = new Date(authorizationDateStr);
    // }

    // // Actualizar la factura con el estado autorizado y el número de autorización
    // await prisma.invoice.update({
    //   where: { id: invoiceId },
    //   data: {
    //     status: "AUTHORIZED",
    //     authorizationNumber: authorizationNumber,
    //     authorizationDate: authorizationDate,
    //     sriResponse: JSON.stringify({
    //       estado: "AUTORIZADO",
    //       numeroAutorizacion: authorizationNumber,
    //       fechaAutorizacion: authorizationDateStr,
    //       fullResponse: authResponseText,
    //     }),
    //   },
    // });

    return {
      success: true,
      authorizationCode: "authorizationNumber",
    };
  } catch (error: any) {
    console.error("Error al autorizar la factura con el SRI:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function authorizeWithSRI(invoiceId: string): Promise<{
  success: boolean;
  authorizationCode?: string;
  error?: string;
}> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        customer: true,
        emissionPoint: {
          include: { establishment: true },
        },
        taxes: true,
        items: {
          include: { product: true },
        },
        paymentMethods: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Aquí iría la lógica para autorizar el comprobante con el SRI
    // Por ahora, simularemos una respuesta exitosa

    const simulatedAuthorizationCode = "0987654321";

    return {
      success: true,
      authorizationCode: simulatedAuthorizationCode,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}
