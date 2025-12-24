"use server";
import { prisma } from "@/lib/prisma";
import { $Enums } from "@/prisma/generated/prisma";

export const getNextSequenceDocumentNumber = async (
  emissionPointId: string,
  documentType: $Enums.DocumentType
): Promise<{
  success: boolean;
  nextSequence?: number;
  error?: string;
}> => {
  try {
    // You may need to provide tenantId as well; adjust as necessary
    const sequenceControl = await prisma.emissionPointSequence.findUnique({
      where: {
        emissionPointId_documentType: {
          emissionPointId: emissionPointId,
          documentType: documentType,
        },
      },
    });

    if (!sequenceControl) {
      return { success: false, error: "Emission point not found." };
    }

    if (documentType === "INVOICE") {
      return {
        success: true,
        nextSequence: sequenceControl.currentSequence,
      };
    }

    return { success: false, error: "Invalid document type." };
  } catch (error) {
    return { success: false, error: "Failed to fetch next document number." };
  }
};
