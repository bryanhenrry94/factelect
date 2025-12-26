"use server";
import { prisma } from "@/lib/prisma";
import { WithholdingCodeCreate } from "@/lib/validations/withholding/withholding-code";

export const getAllWithholdingCodes = async (
  tenantId: string
): Promise<{ success: boolean; data: any[]; error?: string }> => {
  try {
    const data = await prisma.withholdingCode.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: data };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: "Error al consultar códigos de retención",
    };
  }
};

export const createWithholdingCode = async (
  tenantId: string,
  data: WithholdingCodeCreate
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const newCode = await prisma.withholdingCode.create({
      data: {
        tenantId,
        type: data.type,
        code: data.code,
        description: data.description,
        percentage: Number(data.percentage),
        active: data.active,
        accountId: data.accountId,
      },
    });

    return { success: true, data: newCode };
  } catch (error) {
    return {
      success: false,
      error: "Error al crear el código de retención",
    };
  }
};

export const updateWithholdingCode = async (
  id: string,
  data: Partial<WithholdingCodeCreate>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const updatedCode = await prisma.withholdingCode.update({
      where: { id },
      data: {
        type: data.type,
        code: data.code,
        description: data.description,
        percentage: Number(data.percentage),
        active: data.active,
        accountId: data.accountId,
      },
    });

    return { success: true, data: updatedCode };
  } catch (error) {
    return {
      success: false,
      error: "Error al actualizar el código de retención",
    };
  }
};

export const deleteWithholdingCode = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // validar que no existan retenciones asociadas a este código antes de eliminar
    const associatedWithholdings = await prisma.withholdingDetail.findFirst({
      where: { codeId: id },
    });

    if (associatedWithholdings) {
      return {
        success: false,
        error:
          "No se puede eliminar el código de retención porque tiene retenciones asociadas",
      };
    }

    await prisma.withholdingCode.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Error al eliminar el código de retención",
    };
  }
};
