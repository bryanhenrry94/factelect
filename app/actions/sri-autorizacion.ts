import soap from "soap";
import { sriUrls } from "@/constants/sri";

export async function consultarAutorizacionSRI(
  claveAcceso: string,
  ambiente: "1" | "2"
) {
  try {
    const sriUrl =
      ambiente === "1"
        ? sriUrls.sandbox.autorizacion
        : sriUrls.produccion.autorizacion;

    console.log("🔗 Consultando autorización SRI con clave:", claveAcceso);

    // 1️⃣ Crear cliente SOAP
    const client = await soap.createClientAsync(sriUrl);

    // 2️⃣ Invocar método de autorización
    const [result] = await client.autorizacionComprobanteAsync({
      claveAccesoComprobante: claveAcceso,
    });

    // 3️⃣ Analizar respuesta
    const autorizaciones =
      result.RespuestaAutorizacionComprobante.autorizaciones?.autorizacion;

    if (!autorizaciones || autorizaciones.length === 0) {
      return {
        success: false,
        estado: "NO DISPONIBLE",
        mensaje: "El comprobante aún no tiene una respuesta del SRI.",
        raw: result,
      };
    }

    const autorizacion = Array.isArray(autorizaciones)
      ? autorizaciones[0]
      : autorizaciones;

    const estado = autorizacion.estado;
    const fechaAutorizacion = autorizacion.fechaAutorizacion || null;
    const numeroAutorizacion = autorizacion.numeroAutorizacion || null;

    return {
      success: true,
      estado,
      fechaAutorizacion,
      numeroAutorizacion,
      xmlAutorizado: autorizacion.comprobante,
      raw: result,
    };
  } catch (error: any) {
    console.error("❌ Error al consultar autorización:", error.message);
    return { success: false, error: error.message };
  }
}
