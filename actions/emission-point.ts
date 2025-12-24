"use server";
import { prisma } from "@/lib/prisma";
import {
  EmissionPoint,
  EmissionPointWithEstablishmentSchema,
} from "@/lib/validations/e-invoicing/emission-point";

export const getEmissionPoints = async (
  tenantId: string
): Promise<{
  success: boolean;
  data?: EmissionPointWithEstablishmentSchema[];
  error?: string;
}> => {
  try {
    const emissionPoints = await prisma.emissionPoint.findMany({
      where: { tenantId },
      include: {
        establishment: true,
      },
    });
    return { success: true, data: emissionPoints };
  } catch (error) {
    return { success: false, error: "Failed to fetch emission points." };
  }
};

export const createEmissionPoint = async (
  emissionPointData: Omit<EmissionPoint, "id">
): Promise<{ success: boolean; data?: EmissionPoint; error?: string }> => {
  try {
    const newEmissionPoint = await prisma.emissionPoint.create({
      data: emissionPointData,
    });
    return { success: true, data: newEmissionPoint };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to create emission point." };
  }
};

export const updateEmissionPoint = async (
  id: string,
  emissionPointData: Partial<Omit<EmissionPoint, "id">>
): Promise<{ success: boolean; data?: EmissionPoint; error?: string }> => {
  try {
    const updatedEmissionPoint = await prisma.emissionPoint.update({
      where: { id },
      data: emissionPointData,
    });
    return { success: true, data: updatedEmissionPoint };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update emission point." };
  }
};

export const deleteEmissionPoint = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.emissionPoint.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete emission point." };
  }
};

export const getEmissionPointsByEstablishment = async (
  establishmentId: string
): Promise<{
  success: boolean;
  data?: EmissionPointWithEstablishmentSchema[];
  error?: string;
}> => {
  try {
    const emissionPoints = await prisma.emissionPoint.findMany({
      where: { establishmentId },
      include: {
        establishment: true,
      },
    });
    return { success: true, data: emissionPoints };
  } catch (error) {
    return { success: false, error: "Failed to fetch emission points." };
  }
};

export const getEmissionPoint = async (
  id: string
): Promise<{
  success: boolean;
  data?: EmissionPointWithEstablishmentSchema;
  error?: string;
}> => {
  try {
    const emissionPoint = await prisma.emissionPoint.findUnique({
      where: { id },
      include: {
        establishment: true,
      },
    });

    if (!emissionPoint) {
      return { success: false, error: "Emission point not found." };
    }

    return { success: true, data: emissionPoint };
  } catch (error) {
    return { success: false, error: "Failed to fetch emission point." };
  }
};
