"use server";

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// ⚙️ Inicializa el cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FirmarFacturaInput {
  certUrl: string; // URL del .p12 (pública o presigned)
  certPassword: string; // Contraseña del .p12
  xmlDocument: string; // Contenido del XML sin firmar
  tenantId: string; // Identificador del cliente/tenant
}

export async function firmarFactura({
  certUrl,
  certPassword,
  xmlDocument,
  tenantId,
}: FirmarFacturaInput): Promise<{
  success: boolean;
  xmlSigned?: string;
  xmlFilePath?: string;
  xmlFileUrl?: string;
  error?: string;
}> {
  const javaDir = path.join(process.cwd(), "lib", "java");
  const jarPath = path.join(javaDir, "FirmaElectronica.jar");
  const libPath = path.join(javaDir, "lib", "*");

  // 📁 Crear carpeta temporal para proceso de firma
  const tmpDir = path.join("/tmp", `firma_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const certPath = path.join(tmpDir, "certificado.p12");
  const xmlPath = path.join(tmpDir, "factura.xml");
  const signedPath = path.join(tmpDir, "factura_firmada.xml"); // ✅ ruta absoluta

  try {
    // 1️⃣ Descargar el certificado desde Supabase o URL pública
    console.log("📥 Descargando certificado desde:", certUrl);

    const certRes = await axios.get(certUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxRedirects: 5,
    });

    fs.writeFileSync(certPath, certRes.data);
    fs.writeFileSync(xmlPath, xmlDocument);

    // 2️⃣ Ejecutar el JAR de firma
    const args = [
      "-cp",
      `${jarPath}:${libPath}`,
      "firmaelectronica.FirmaElectronica",
      certPath,
      certPassword,
      xmlPath,
      tmpDir, 
      "factura_firmada.xml",
    ];

    console.log("🚀 Ejecutando comando Java:", ["java", ...args].join(" "));

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("java", args);

      let stderr = "";
      let stdout = "";

      proc.stdout.on("data", (data) => {
        stdout += data.toString();
        console.log("🟢 Java stdout:", data.toString());
      });

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          console.error("🔴 Error en FirmaElectronica.jar:", stderr);
          reject(
            new Error(stderr || `Proceso Java finalizó con código ${code}`)
          );
        } else {
          console.log("✅ Proceso Java finalizado correctamente.");
          resolve();
        }
      });
    });

    // 3️⃣ Verificar que el archivo firmado exista
    if (!fs.existsSync(signedPath)) {
      throw new Error(`Archivo firmado no encontrado en ${signedPath}`);
    }

    // 4️⃣ Leer el archivo firmado
    const signedBuffer = fs.readFileSync(signedPath);
    const xmlSigned = signedBuffer.toString("utf8");

    console.log("📄 XML firmado leído correctamente.");

    // 5️⃣ Subir el archivo firmado a Supabase Storage
    const filePath = `${tenantId}/xml/firmados/factura_${Date.now()}.xml`;

    const { error: uploadError } = await supabase.storage
      .from("facturacion")
      .upload(filePath, signedBuffer, {
        contentType: "application/xml",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // 6️⃣ Obtener URL pública del archivo firmado
    const {
      data: { publicUrl },
    } = supabase.storage.from("facturacion").getPublicUrl(filePath);

    return {
      success: true,
      xmlSigned,
      xmlFilePath: filePath,
      xmlFileUrl: publicUrl,
    };
  } catch (err: any) {
    console.error("❌ Error al firmar:", err);
    return {
      success: false,
      error: err.message || "Error al firmar el XML",
    };
  } finally {
    // 7️⃣ Limpieza del directorio temporal
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
