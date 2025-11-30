import soap from "soap";
import { sriUrls } from "@/constants/sri";

export async function enviarComprobanteAlSRI(
  xmlFirmado: string,
  ambiente: "1" | "2"
) {
  try {
    const sriUrl =
      ambiente === "1"
        ? sriUrls.sandbox.recepcion
        : sriUrls.produccion.recepcion;

    // 1️⃣ Crear cliente SOAP
    const client = await soap.createClientAsync(sriUrl);

    // 2️⃣ Convertir el XML firmado a base64
    const xmlBase64 = Buffer.from(xmlFirmado, "utf8").toString("base64");

    // 3️⃣ Llamar al método SOAP
    const [result] = await client.validarComprobanteAsync({ xml: xmlBase64 });

    console.log("📨 Respuesta del SRI:", result);

    // 4️⃣ Leer estado de respuesta
    const estado = result.RespuestaRecepcionComprobante.estado;

    return {
      success: true,
      estado,
      raw: result,
    };
  } catch (error: any) {
    console.error("❌ Error al consumir servicio SRI:", error.message);
    return { success: false, error: error.message };
  }
}
