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
    // valida que el detalle tenga un monto mayor a cero
    if (!data.personId) {
      return {
        success: false,
        error: "Debe seleccionar una persona para la transacción.",
      };
    }

    if (data.documents && data.documents.length > 0) {
      const totalAmount = data.documents.reduce(
        (sum, doc) => sum + doc.amount,
        0
      );
      if (totalAmount <= 0) {
        return {
          success: false,
          error: "El monto total de los documentos debe ser mayor a cero.",
        };
      }

      // monto no puede ser mayor al saldo pendiente de los documentos
      for (const doc of data.documents) {
        const document = await prisma.document.findUnique({
          where: { id: doc.documentId },
          select: { balance: true },
        });

        if (document && doc.amount > document.balance) {
          return {
            success: false,
            error: `El monto aplicado no puede ser mayor al saldo pendiente.`,
          };
        }
      }
    }

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
            cashBoxId: parsedData.cashBoxId,
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

export type FilterTransactionsParams = {
  tenantId: string;
  search?: string;
  type?: "INCOME" | "EXPENSE";
  method?: "CASH" | "TRANSFER";
  personId?: string;
  fromDate?: string;
  toDate?: string;
};

export const getTransactions = async (
  params: FilterTransactionsParams
): Promise<{ success: boolean; error?: string; data?: TransactionInput[] }> => {
  try {
    const { tenantId, search, type, method, fromDate, toDate, personId } =
      params;

    // 🔁 Convertir strings a Date (normalizando inicio/fin del día)
    const from = fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : undefined;

    const to = toDate ? new Date(`${toDate}T23:59:59.999Z`) : undefined;

    const where: any = {
      tenantId,
      ...(type && { type }),
      ...(method && { method }),
      ...(personId && { personId }),
      ...(from || to
        ? {
            issueDate: {
              ...(from && { gte: from }),
              ...(to && { lte: to }),
            },
          }
        : {}),
      ...(search &&
        search.trim() && {
          OR: [
            { reference: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            {
              person: {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { businessName: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          ],
        }),
    };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { issueDate: "desc" },
      include: {
        documents: true,
        person: true,
      },
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
