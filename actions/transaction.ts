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
    if (!data.personId) {
      return { success: false, error: "Debe seleccionar una persona." };
    }

    if (!data.amount || data.amount <= 0) {
      return { success: false, error: "El monto debe ser mayor a cero." };
    }

    // Validar documentos
    if (data.documents?.length) {
      const totalDocs = data.documents.reduce(
        (s, d) => s + Number(d.amount),
        0
      );

      if (totalDocs <= 0) {
        return {
          success: false,
          error: "El monto aplicado a documentos debe ser mayor a cero.",
        };
      }

      if (Number(totalDocs) !== Number(data.amount)) {
        return {
          success: false,
          error: "El monto de la transacción no coincide con los documentos.",
        };
      }

      for (const doc of data.documents) {
        const document = await prisma.document.findUnique({
          where: { id: doc.documentId },
          select: { balance: true },
        });

        if (!document || Number(doc.amount) > Number(document.balance)) {
          return {
            success: false,
            error: "El monto aplicado supera el saldo pendiente del documento.",
          };
        }
      }
    }

    const parsedData = createTransactionSchema.parse(data);

    const result = await prisma.$transaction(async (tx) => {
      /* ===========================
       * 1. Crear transacción
       * =========================== */
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

      const isIncome = parsedData.type === "INCOME";
      const amount = Number(parsedData.amount);

      /* ===========================
       * 2. Aplicar a documentos
       * =========================== */
      if (parsedData.documents?.length) {
        for (const doc of parsedData.documents) {
          await tx.transactionDocument.create({
            data: {
              transactionId: transaction.id,
              documentId: doc.documentId,
              amount: doc.amount,
              tenantId,
            },
          });

          const document = await tx.document.findUnique({
            where: { id: doc.documentId },
            select: { total: true, paidAmount: true },
          });

          if (!document) throw new Error("Documento no encontrado");

          const paid = Number(document.paidAmount || 0) + Number(doc.amount);
          const balance = Number(document.total) - paid;

          await tx.document.update({
            where: { id: doc.documentId },
            data: {
              paidAmount: paid,
              balance: Math.max(balance, 0),
            },
          });
        }
      }

      /* ===========================
       * 3. Movimiento Caja
       * =========================== */
      if (parsedData.method === "CASH") {
        if (!parsedData.cashBoxId) throw new Error("Caja no especificada");

        await tx.cashMovement.create({
          data: {
            cashBoxId: parsedData.cashBoxId,
            transactionId: transaction.id,
            type: isIncome ? "IN" : "OUT",
            amount,
            description: parsedData.description ?? "",
            issueDate: parsedData.issueDate,
            tenantId,
          },
        });
      }

      /* ===========================
       * 4. Movimiento Banco + Contabilidad
       * =========================== */
      if (parsedData.method === "TRANSFER") {
        if (!parsedData.bankAccountId)
          throw new Error("Cuenta bancaria no especificada");

        const person = await tx.person.findUnique({
          where: { id: parsedData.personId },
        });
        if (!person) throw new Error("Persona no encontrada");

        const counterAccountId = isIncome
          ? person.accountReceivableId
          : person.accountPayableId;

        if (!counterAccountId)
          throw new Error("Cuenta contable de la persona no configurada");

        const bankMov = await tx.bankMovement.create({
          data: {
            bankAccountId: parsedData.bankAccountId,
            transactionId: transaction.id,
            type: isIncome ? "CREDIT" : "DEBIT",
            amount,
            description: parsedData.description ?? "",
            date: parsedData.issueDate,
            tenantId,
          },
        });

        const bankMovDet = await tx.bankMovementDetail.create({
          data: {
            tenantId,
            bankMovementId: bankMov.id,
            description: parsedData.description ?? "",
            costCenterId: null,
            accountId: counterAccountId,
            amount,
          },
        });

        const journal = await tx.journalEntry.create({
          data: {
            tenantId,
            date: parsedData.issueDate,
            description: parsedData.description ?? "",
            sourceType: "BANK_MOVEMENT",
            sourceId: bankMov.id,
            type: parsedData.type,
          },
        });

        const bankAccount = await tx.bankAccount.findUnique({
          where: { id: parsedData.bankAccountId },
        });
        if (!bankAccount)
          throw new Error("Cuenta bancaria no encontrada para la transacción");

        /* Asientos contables */
        // 🏦 Banco
        await tx.journalEntryLine.create({
          data: {
            tenantId,
            journalEntryId: journal.id,
            accountId: bankAccount.accountId!,
            debit: isIncome ? amount : 0,
            credit: isIncome ? 0 : amount,
          },
        });

        // 👤 Cliente / Proveedor
        await tx.journalEntryLine.create({
          data: {
            tenantId,
            journalEntryId: journal.id,
            accountId: counterAccountId,
            debit: isIncome ? 0 : amount,
            credit: isIncome ? amount : 0,
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
  } catch (error: any) {
    console.error("❌ Error creating transaction:", error);
    return {
      success: false,
      error: error.message || "Error al crear la transacción",
    };
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
