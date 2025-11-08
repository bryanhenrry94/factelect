"use server";

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// ⚙️ Inicializa el cliente de Supabase (usa tus variables de entorno)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // usa SERVICE ROLE para subir
);

interface FirmarFacturaInput {
  certUrl: string; // URL pública o presigned del .p12
  certPassword: string; // contraseña del .p12
  xmlDocument: string; // URL pública o presigned del XML sin firmar
  tenantId: string; // opcional, para organizar por cliente
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

  const tmpDir = path.join("/tmp", `firma_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const certPath = path.join(tmpDir, "certificado.p12");
  const xmlPath = path.join(tmpDir, "factura.xml");
  const signedPath = path.join(tmpDir, "factura_firmada.xml");

  try {
    // 1️⃣ Descargar archivos desde Supabase o URLs públicas
    console.log("Downloading cert from URL:", { certUrl });

    let certRes;
    try {
      certRes = await axios.get(certUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        maxRedirects: 5,
      });
    } catch (downloadError: any) {
      console.error("Download error details:", {
        message: downloadError.message,
        status: downloadError.response?.status,
        statusText: downloadError.response?.statusText,
        data: downloadError.response?.data,
        certUrl,
      });
      throw new Error(`Failed to download files: ${downloadError.message}`);
    }

    fs.writeFileSync(certPath, certRes.data);
    fs.writeFileSync(xmlPath, xmlDocument);

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

    await new Promise<void>((resolve, reject) => {
      const proc = spawn("java", args);

      let stderr = "";
      proc.stderr.on("data", (data) => (stderr += data.toString()));

      proc.on("close", (code) => {
        if (code !== 0) reject(new Error(stderr));
        else resolve();
      });
    });

    // 3️⃣ Leer el archivo firmado
    const signedBuffer = fs.readFileSync(signedPath);

    // crear xmlSigned
    const xmlSigned = fs.readFileSync(signedPath, "utf8");

    // 4️⃣ Subir el archivo firmado a Supabase Storage
    const filePath = `${tenantId}/xml/firmados/factura_${Date.now()}.xml`;

    const { data, error } = await supabase.storage
      .from("facturacion") // nombre del bucket
      .upload(filePath, signedBuffer, {
        contentType: "application/xml",
        upsert: true,
      });

    if (error) throw error;

    // 5️⃣ Obtener la URL pública o firmada
    const {
      data: { publicUrl },
    } = supabase.storage.from("facturacion").getPublicUrl(filePath);

    return {
      success: true,
      xmlSigned: xmlSigned,
      xmlFilePath: filePath,
      xmlFileUrl: publicUrl,
    };
  } catch (err: any) {
    console.error("Error al firmar:", err);
    return {
      success: false,
      error: err.message || "Error al firmar el XML",
    };
  } finally {
    // 6️⃣ Limpieza
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
