"use server";
import { prisma } from "@/lib/prisma";
import { DocumentPayment, documentPaymentSchema } from "@/lib/validations";

export const getDocumentPayments = async (
  documentId: string
): Promise<{
  success: boolean;
  data: DocumentPayment[] | null;
  error?: string;
}> => {
  try {
    const payments = await prisma.documentPayment.findMany({
      where: { documentId },
    });

    const paymentFormatted: DocumentPayment[] = payments.map((payment) =>
      documentPaymentSchema.parse({
        id: payment.id,
        documentId: payment.documentId,
        paymentMethod: payment.paymentMethod,
        term: payment.term,
        termUnit: payment.termUnit,
        amount: payment.amount.toNumber(),
        createdAt: payment.createdAt,
      })
    );

    return { success: true, data: paymentFormatted };
  } catch (error) {
    console.error("Error fetching document payments:", error);
    return {
      success: false,
      data: null,
      error: "Error fetching document payments",
    };
  }
};
