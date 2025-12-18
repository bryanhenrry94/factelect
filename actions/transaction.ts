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

    const result = await prisma.$transaction(async (tx) => {
      /* -------------------------------------------------
       * 1. Crear Transacción
       * ------------------------------------------------- */
      const transaction = await tx.transaction.create({
        data: {
          personId: parsedData.personId,
          type: parsedData.type,
          method: parsedData.method,
          amount: parsedData.amount,
          issueDate: parsedData.issueDate,
          reference: parsedData.reference ?? null,
          description: parsedData.description ?? null,
          reconciled: parsedData.reconciled ?? false,
          reconciledAt: parsedData.reconciledAt ?? null,
          bankAccountId: parsedData.bankAccountId ?? null,
          cashBoxId: parsedData.cashBoxId ?? null,
          tenantId,
        },
      });

      /* -------------------------------------------------
       * 2. Aplicar pagos a documentos
       * ------------------------------------------------- */
      if (parsedData.documents?.length) {
        for (const doc of parsedData.documents) {
          // Relación transacción-documento
          await tx.transactionDocument.create({
            data: {
              transactionId: transaction.id,
              documentId: doc.documentId,
              amount: doc.amount,
              tenantId,
            },
          });

          // Documento actual
          const document = await tx.document.findUnique({
            where: { id: doc.documentId },
            select: {
              total: true,
              paidAmount: true,
            },
          });

          if (!document) {
            throw new Error("Documento no encontrado");
          }

          const newPaidAmount =
            Number(document.paidAmount || 0) + Number(doc.amount);

          const newBalance = Number(document.total) - newPaidAmount;

          await tx.document.update({
            where: { id: doc.documentId },
            data: {
              paidAmount: newPaidAmount,
              balance: Math.max(newBalance, 0),
            },
          });
        }
      }

      /* -------------------------------------------------
       * 3. Generar movimiento Caja / Banco
       * ------------------------------------------------- */
      const isIncome = parsedData.type === "INCOME";
      const isExpense = parsedData.type === "EXPENSE";

      if (parsedData.method === "CASH") {
        if (!parsedData.cashBoxId) {
          throw new Error("Caja no especificada");
        }

        await tx.cashMovement.create({
          data: {
            cashSessionId: parsedData.cashBoxId,
            transactionId: transaction.id,
            type: isIncome ? "IN" : "OUT",
            amount: parsedData.amount,
            description: parsedData.description ?? "",
            issueDate: parsedData.issueDate,
            tenantId,
          },
        });
      }

      if (parsedData.method === "TRANSFER") {
        if (!parsedData.bankAccountId) {
          throw new Error("Cuenta bancaria no especificada");
        }

        const bankMov = await tx.bankMovement.create({
          data: {
            bankAccountId: parsedData.bankAccountId,
            transactionId: transaction.id,
            type: isIncome ? "CREDIT" : "DEBIT",
            amount: parsedData.amount,
            description: parsedData.description ?? "",
            date: parsedData.issueDate,
            tenantId,
          },
        });
      }

      return transaction;
    });

    return {
      success: true,
      data: {
        ...result,
        documents: parsedData.documents || [],
      },
    };
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
