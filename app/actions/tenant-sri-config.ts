"use server";
import { prisma } from "@/lib/prisma";
import {
  TenantSriConfig,
  UpdateTenantSriConfig,
  updateTenantSriConfigSchema,
} from "@/lib/validations/sri-config";

export const getTenantSriConfig = async (
  tenantId: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const config = await prisma.sRIConfiguration.findUnique({
      where: { tenantId },
    });

    return { success: true, data: config || null };
  } catch (error) {
    console.error("Error fetching tenant SRI config:", error);
    return { success: false, error: "Error fetching tenant SRI config" };
  }
};

export const updateTenantSriConfig = async (
  tenantId: string,
  data: Partial<UpdateTenantSriConfig>
): Promise<{ success: boolean; data?: TenantSriConfig; error?: string }> => {
  try {
    // ✅ 1. Validar datos antes de actualizar
    const parsed = updateTenantSriConfigSchema.safeParse(data);

    if (!parsed.success) {
      console.warn(
        "Datos inválidos al actualizar configuración SRI:",
        parsed.error.format()
      );
      return {
        success: false,
        error: "Datos inválidos en la configuración SRI.",
      };
    }

    // ✅ 2. Filtrar solo los campos válidos y definidos
    const cleanData = Object.fromEntries(
      Object.entries(parsed.data).filter(([_, value]) => value !== undefined)
    );

    console.log("Datos limpios para actualización SRI:", cleanData);
    // Si no hay campos válidos para actualizar, no ejecutamos la query
    if (Object.keys(cleanData).length === 0) {
      return {
        success: false,
        error: "No hay campos válidos para actualizar.",
      };
    }

    console.log("cleanData: ", cleanData);
    // ✅ 3. Ejecutar actualización parcial
    const updatedConfig = await prisma.sRIConfiguration.upsert({
      where: { tenantId },
      update: { ...cleanData },
      create: { tenantId, environment: "TEST", ...cleanData },
    });

    console.log("Configuración SRI actualizada:", updatedConfig);

    // ✅ 4. Adaptar el resultado al tipo esperado
    const formattedConfig: TenantSriConfig = {
      id: updatedConfig.id,
      tenantId: updatedConfig.tenantId,
      environment: updatedConfig.environment as "TEST" | "PRODUCTION",
      certificatePath: updatedConfig.certificatePath,
      certificatePassword: updatedConfig.certificatePassword,
      createdAt: updatedConfig.createdAt,
      updatedAt: updatedConfig.updatedAt,
    };

    return { success: true, data: formattedConfig };
  } catch (error) {
    console.error("Error al actualizar configuración SRI:", error);
    return { success: false, error: "Error al actualizar configuración SRI." };
  }
};

export const updateCertificatePath = async (
  tenantId: string,
  certificatePath: string,
  certificateUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.sRIConfiguration.upsert({
      where: { tenantId },
      update: { certificatePath, certificateUrl },
      create: {
        tenantId,
        certificatePath,
        certificateUrl,
        environment: "TEST",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating certificate path:", error);
    return { success: false, error: "Error updating certificate path." };
  }
};

export const updateCertificatePassword = async (
  id: string,
  certificatePassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.sRIConfiguration.update({
      where: { id },
      data: { certificatePassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating certificate password:", error);
    return { success: false, error: "Error updating certificate password." };
  }
};
