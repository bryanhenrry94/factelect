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
        type: parsedData.type,
        method: parsedData.method,
        issueDate: parsedData.issueDate,
        reference: parsedData.reference ?? null,
        description: parsedData.description ?? null,
        personId: parsedData.personId,
        accountId: parsedData.accountId,
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

        const movementType = parsedData.type === "INCOME" ? "IN" : "OUT";

        // Create corresponding movement
        await prisma.movement.create({
          data: {
            type: movementType,
            amount: doc.amount,
            date: parsedData.issueDate,
            description: `Movimiento por documento en transacción ID:${transaction.id}`,
            accountId: parsedData.accountId,
            transactionId: transaction.id,
            tenantId,
          },
        });

        // update paidAmount and balance in the document (invoice)
        const invoice = await prisma.invoice.findUnique({
          where: { id: doc.documentId },
        });

        if (invoice) {
          const newPaidAmount = (invoice.paidAmount || 0) + doc.amount;
          const newBalance = invoice.total - newPaidAmount;

          await prisma.invoice.update({
            where: { id: doc.documentId },
            data: {
              paidAmount: newPaidAmount,
              balance: newBalance,
            },
          });
        }

        // updata account balance
        const account = await prisma.account.findUnique({
          where: { id: parsedData.accountId },
        });

        if (account) {
          const newBalance =
            movementType === "IN"
              ? account.balance + doc.amount
              : account.balance - doc.amount;

          await prisma.account.update({
            where: { id: parsedData.accountId },
            data: {
              balance: newBalance,
            },
          });
        }
      }
    }

    return { success: true, data: transaction };
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
        type: parsedData.type,
        method: parsedData.method,
        issueDate: parsedData.issueDate,
        reference: parsedData.reference ?? null,
        description: parsedData.description ?? null,
        personId: parsedData.personId,
        accountId: parsedData.accountId,
      },
    });

    return { success: true, data: transaction };
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
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    return { success: true, data: transaction };
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
    });

    return { success: true, data: transactions };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return { success: false, error: "Error fetching transactions" };
  }
};
