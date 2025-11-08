"use server";

import { createClient } from "@supabase/supabase-js";
import { generateXmlSRI } from "./sri-document";
import { uuid } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Solo en el servidor
);

export async function uploadCertificateAction(formData: FormData) {
  const file = formData.get("file") as File;
  const tenantId = formData.get("tenantId") as string; // opcional, si deseas agrupar por cliente o empresa

  if (!file) {
    return { success: false, error: "No se encontró ningún archivo" };
  }

  if (!tenantId) {
    return { success: false, error: "tenantId es requerido" };
  }

  // Validar tipo de archivo
  if (!file.name.endsWith(".p12")) {
    return { success: false, error: "Solo se permiten archivos .p12" };
  }

  const filePath = `${tenantId}/certificados/firma.p12`;

  const { data, error } = await supabase.storage
    .from("facturacion") // 👈 tu bucket en Supabase
    .upload(filePath, file, {
      contentType: "application/x-pkcs12",
      cacheControl: "3600",
      upsert: true, // puedes evitar reemplazos si quieres
    });

  if (error) {
    console.error("Error al subir el archivo:", error);
    return { success: false, error: error.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("facturacion")
    .getPublicUrl(filePath);

  return { success: true, path: filePath, url: publicUrlData.publicUrl };
}

export async function uploadLogoAction(formData: FormData) {
  const file = formData.get("file") as File;
  const tenantId = formData.get("tenantId") as string;

  if (!file) {
    return { success: false, error: "No se encontró ningún archivo" };
  }

  const filePath = `${tenantId}/logos/${file.name}`;

  const { data, error } = await supabase.storage
    .from("facturacion") // 👈 tu bucket en Supabase
    .upload(filePath, file, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Error al subir el logo:", error);
    return { success: false, error: error.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("facturacion")
    .getPublicUrl(filePath);

  return { success: true, path: filePath, url: publicUrlData.publicUrl };
}

export async function uploadInvoiceXML(
  tenantId: string,
  xmlDocument: string
): Promise<{ success: boolean; error?: string; path?: string; url?: string }> {
  if (!tenantId) {
    return { success: false, error: "tenantId es requerido" };
  }

  if (!xmlDocument) {
    return { success: false, error: "El documento XML es requerido" };
  }

  const id = crypto.randomUUID();
  const filename = `factura_${id}.xml`;
  const filePath = `${tenantId}/xml/generados/${filename}`;

  // Subir el XML a Supabase Storage
  const { data, error } = await supabase.storage
    .from("facturacion")
    .upload(filePath, xmlDocument);

  if (error) {
    console.error("Error uploading XML to Supabase:", error);
    return { success: false, error: error.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("facturacion")
    .getPublicUrl(filePath);

  return { success: true, path: filePath, url: publicUrlData.publicUrl };
}
