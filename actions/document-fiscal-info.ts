"use server";
import { prisma } from "@/lib/prisma";

export const getDocumentFiscalInfo = async (documentId: string) => {
  try {
    const fiscalInfo = await prisma.documentFiscalInfo.findUnique({
      where: { documentId },
    });

    if (!fiscalInfo) {
      return { success: false, data: null, error: "Fiscal info not found" };
    }

    return { success: true, data: fiscalInfo, error: null };
  } catch (error) {
    return { success: false, data: null, error: "Error fetching fiscal info" };
  }
};
