"use server";
import { prisma } from "@/lib/prisma";
import { TransactionDocumentInput } from "@/lib/validations/transaction-document";

export const getTransactionDocuments = async (
  transactionId: string,
  tenantId: string
): Promise<{
  success: boolean;
  error?: string;
  data?: TransactionDocumentInput[];
}> => {
  try {
    const documents = await prisma.transactionDocument.findMany({
      where: {
        transactionId,
        tenantId,
      },
      include: {
        document: true,
      },
    });

    return { success: true, data: documents };
  } catch (error) {
    return { success: false, error: "No se pudieron obtener los documentos." };
  }
};
