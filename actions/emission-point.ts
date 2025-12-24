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
    // valida que no exista otro punto de emisión con el mismo código en la misma establecimiento
    const existingEP = await prisma.emissionPoint.findFirst({
      where: {
        establishmentId: emissionPointData.establishmentId,
        code: emissionPointData.code,
      },
    });

    if (existingEP) {
      return {
        success: false,
        error:
          "Ya existe un punto de emisión con este código en el establecimiento seleccionado.",
      };
    }

    const newEmissionPoint = await prisma.emissionPoint.create({
      data: {
        establishmentId: emissionPointData.establishmentId,
        tenantId: emissionPointData.tenantId,
        code: emissionPointData.code,
        description: emissionPointData.description,
        isActive: emissionPointData.isActive,
      },
    });

    // Create sequences if provided
    if (emissionPointData.sequences && emissionPointData.sequences.length > 0) {
      for (const seq of emissionPointData.sequences) {
        await prisma.emissionPointSequence.create({
          data: {
            emissionPointId: newEmissionPoint.id,
            documentType: seq.documentType,
            currentSequence: Number(seq.currentSequence),
          },
        });
      }
    }

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
      data: {
        establishmentId: emissionPointData.establishmentId,
        code: emissionPointData.code,
        description: emissionPointData.description,
        isActive: emissionPointData.isActive,
      },
    });

    // Update sequences if provided
    if (emissionPointData.sequences && emissionPointData.sequences.length > 0) {
      for (const seq of emissionPointData.sequences) {
        await prisma.emissionPointSequence.upsert({
          where: {
            emissionPointId_documentType: {
              emissionPointId: updatedEmissionPoint.id,
              documentType: seq.documentType,
            },
          },
          update: {
            currentSequence: Number(seq.currentSequence),
          },
          create: {
            emissionPointId: updatedEmissionPoint.id,
            documentType: seq.documentType,
            currentSequence: Number(seq.currentSequence),
          },
        });
      }
    }

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
