"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateTransactionInput,
  createTransactionSchema,
  TransactionInput,
} from "@/lib/validations";

export const createTransaction = async (
  data: CreateTransactionInput,
  tenantId: string
): Promise<{ success: boolean; error?: string; data?: TransactionInput }> => {
  try {
    const parsedData = createTransactionSchema.parse(data);

    const transaction = await prisma.transaction.create({
      data: {
        personId: parsedData.personId,
        type: parsedData.type,
        method: parsedData.method,
        amount: parsedData.amount,
        issueDate: parsedData.issueDate,
        reference: parsedData.reference ?? null,
        description: parsedData.description ?? null,
        // documents: parsedData.documents,
        reconciled: parsedData.reconciled ?? false,
        reconciledAt: parsedData.reconciledAt ?? null,
        bankAccountId: parsedData.bankAccountId ?? null,
        cashBoxId: parsedData.cashBoxId ?? null,
        tenantId,
      },
    });

    if (parsedData.documents && parsedData.documents.length > 0) {
      for (const doc of parsedData.documents) {
        await prisma.transactionDocument.create({
          data: {
            transactionId: transaction.id,
            documentId: doc.documentId,
            amount: doc.amount,
            tenantId,
          },
        });
      }
    }

    const transactionFormatted: TransactionInput = {
      ...transaction,
      documents: parsedData.documents || [],
    };

    return { success: true, data: transactionFormatted };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Error creating transaction" };
  }
};

export const updateTransaction = async (
  transactionId: string,
  data: Partial<CreateTransactionInput>
): Promise<{ success: boolean; error?: string; data?: TransactionInput }> => {
  try {
    const parsedData = createTransactionSchema.partial().parse(data);

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        personId: parsedData.personId,
        type: parsedData.type,
        method: parsedData.method,
        amount: parsedData.amount,
        issueDate: parsedData.issueDate,
        reference: parsedData.reference ?? null,
        description: parsedData.description ?? null,
        // documents: parsedData.documents,
        reconciled: parsedData.reconciled ?? false,
        reconciledAt: parsedData.reconciledAt ?? null,
        bankAccountId: parsedData.bankAccountId ?? null,
        cashBoxId: parsedData.cashBoxId ?? null,
      },
    });

    const transactionFormatted: TransactionInput = {
      ...transaction,
      documents: parsedData.documents || [],
    };

    return { success: true, data: transactionFormatted };
  } catch (error) {
    console.error("Error updating transaction:", error);
    return { success: false, error: "Error updating transaction" };
  }
};

export const getTransaction = async (
  transactionId: string
): Promise<{ success: boolean; error?: string; data?: TransactionInput }> => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { documents: true },
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    const transactionFormatted: TransactionInput = {
      ...transaction,
      documents: transaction.documents || [],
    };

    return { success: true, data: transactionFormatted };
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return { success: false, error: "Error fetching transaction" };
  }
};

export const getTransactions = async (
  tenantId: string
): Promise<{ success: boolean; error?: string; data?: TransactionInput[] }> => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { tenantId },
      orderBy: { issueDate: "desc" },
      include: { documents: true },
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: "Error fetching transactions" };
  }
};

export const deleteTransaction = async (
  transactionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return { success: false, error: "Error deleting transaction" };
  }
};
