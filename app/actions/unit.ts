"use server";
import { prisma } from "@/lib/prisma";
import { CreateUnit, Unit, UpdateUnit } from "@/lib/validations/unit";

// crud
export const getUnits = async (
  tenantId: string,
  search?: string
): Promise<{ success: boolean; error?: string; data: Unit[] }> => {
  try {
    const units = await prisma.unit.findMany({
      where: {
        tenantId,
        name: { contains: search || "", mode: "insensitive" },
      },
    });
    return { success: true, data: units };
  } catch (error: any) {
    console.error("Error fetching units:", error);
    return { success: false, error: "Error al obtener las unidades", data: [] };
  }
};

export const createUnit = async (
  tenantId: string,
  data: CreateUnit
): Promise<{ success: boolean; error?: string; data?: Unit }> => {
  try {
    const newUnit = await prisma.unit.create({
      data: {
        tenantId,
        name: data.name,
        symbol: data.symbol,
      },
    });
    return { success: true, data: newUnit };
  } catch (error: any) {
    console.error("Error creating unit:", error);
    return { success: false, error: "Error al crear la unidad" };
  }
};

export const updateUnit = async (
  unitId: string,
  data: UpdateUnit
): Promise<{ success: boolean; error?: string; data?: Unit }> => {
  try {
    const updatedUnit = await prisma.unit.updateMany({
      where: {
        id: unitId,
      },
      data: {
        ...data,
      },
    });

    if (updatedUnit.count === 0) {
      return { success: false, error: "Unidad no encontrada o sin permisos" };
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      return {
        success: false,
        error: "Unidad no encontrada después de la actualización",
      };
    }

    return { success: true, data: unit };
  } catch (error: any) {
    console.error("Error updating unit:", error);
    return { success: false, error: "Error al actualizar la unidad" };
  }
};

export const deleteUnit = async (
  unitId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const deletedUnit = await prisma.unit.deleteMany({
      where: {
        id: unitId,
      },
    });

    if (deletedUnit.count === 0) {
      return { success: false, error: "Unidad no encontrada o sin permisos" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting unit:", error);
    return { success: false, error: "Error al eliminar la unidad" };
  }
};
