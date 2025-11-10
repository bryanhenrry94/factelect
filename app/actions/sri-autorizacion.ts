import soap from "soap";
import { sriUrls } from "@/constants/sri";

interface AutorizacionResponse {
  success: boolean;
  estado: string;
  fechaAutorizacion?: string;
  numeroAutorizacion?: string;
  xmlAutorizado?: string;
  mensaje?: string;
  tipoError?: string;
  error?: string;
  raw?: any;
}

export async function consultarAutorizacionSRI(
  claveAcceso: string,
  ambiente: "1" | "2"
): Promise<AutorizacionResponse> {
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

    // 3️⃣ Validar estructura de respuesta
    if (!result?.RespuestaAutorizacionComprobante) {
      return {
        success: false,
        estado: "ERROR",
        mensaje: "Respuesta inválida del SRI: estructura no reconocida.",
        raw: result,
      };
    }

    // 4️⃣ Analizar respuesta
    const autorizaciones =
      result.RespuestaAutorizacionComprobante.autorizaciones?.autorizacion;

    if (
      !autorizaciones ||
      (Array.isArray(autorizaciones) && autorizaciones.length === 0)
    ) {
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

    const estado = autorizacion?.estado;
    const fechaAutorizacion = autorizacion?.fechaAutorizacion || null;
    const numeroAutorizacion = autorizacion?.numeroAutorizacion || null;

    // 5️⃣ Mapear estados de no autorización
    if (estado === "NO AUTORIZADO") {
      const mensajes = autorizacion.mensajes?.mensaje || [];
      const mensajesArray = Array.isArray(mensajes) ? mensajes : [mensajes];

      const error = JSON.stringify(
        mensajesArray.map((m: any) => ({
          identificador: m?.identificador || "N/A",
          mensaje: m?.mensaje || "Sin descripción",
          tipo: m?.tipo || "ERROR",
          informacionAdicional: m?.informacionAdicional || "",
        })),
        null,
        2
      );

      //  const error = JSON.stringify(
      //   mensajesArray.map((m: any) => ({
      //     identificador: m?.identificador || "N/A",
      //     mensaje: m?.mensaje || "Sin descripción",
      //     tipo: m?.tipo || "ERROR",
      //     informacionAdicional: m?.informacionAdicional || "",
      //   })),
      //   null,
      //   2
      // );

      return {
        success: false,
        estado: "NO AUTORIZADO",
        mensaje: "El comprobante fue rechazado por el SRI.",
        error: error,
        raw: result,
      };
    }

    // 6️⃣ Validar estado AUTORIZADO
    if (estado !== "AUTORIZADO") {
      return {
        success: false,
        estado: estado || "DESCONOCIDO",
        mensaje: `Estado inesperado: ${estado || "Sin estado"}`,
        raw: result,
      };
    }

    // 7️⃣ Respuesta exitosa
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

    // Mapear errores de conexión/SOAP
    const errorMessage = error.message || "Error desconocido";
    let tipoError = "ERROR_DESCONOCIDO";

    if (
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("ENOTFOUND")
    ) {
      tipoError = "ERROR_CONEXION";
    } else if (errorMessage.includes("timeout")) {
      tipoError = "ERROR_TIMEOUT";
    } else if (errorMessage.includes("SOAP")) {
      tipoError = "ERROR_SOAP";
    }

    return {
      success: false,
      estado: "ERROR",
      tipoError,
      error: errorMessage,
    };
  }
}
