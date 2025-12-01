"use server";

import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function importCOAFromSupabase() {
  try {
    const fileUrl =
      "https://yfrqdghdjziwswilefwx.supabase.co/storage/v1/object/public/templates/plan_cuentas.xlsx";

    console.log("📥 Descargando archivo desde:", fileUrl);

    // 1. Descargar archivo como ArrayBuffer
    const res = await fetch(fileUrl);

    if (!res.ok) {
      throw new Error(`No se pudo descargar el archivo: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();

    // 2. Leer Excel desde memoria
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: null, // evita undefined
    });

    console.log(`📄 Registros encontrados: ${rows.length}`);

    // 3. Limpiar tabla anterior
    await prisma.chartOfAccountTemplate.deleteMany();

    // 4. Insertar
    await prisma.chartOfAccountTemplate.createMany({
      data: rows.map((r: any) => ({
        code: r.code,
        name: r.name,
        accountType: r.account_type,
        parentCode: r.parent_code ? r.parent_code.toString() : null,
      })),
    });

    console.log("🎉 Template de COA importado correctamente");

    return {
      success: true,
      message: "Importación exitosa",
      count: rows.length,
    };
  } catch (err: any) {
    console.error("❌ Error al importar COA:", err);
    return { success: false, error: err.message };
  }
}
