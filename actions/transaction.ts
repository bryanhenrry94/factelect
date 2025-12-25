"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateTransactionInput,
  createTransactionSchema,
  TransactionInput,
} from "@/lib/validations";
import { createCashMovementTx } from "./cash/cash-movement";
import { CreateCashMovement } from "@/lib/validations/cash/cash_movement";
import { CreateBankMovement } from "@/lib/validations/bank/bank_movement";
import { createBankMovementTx } from "./bank/bank-movement";

export const validateTransactionData = async (
  data: Partial<CreateTransactionInput>
): Promise<{ success: boolean; error?: string }> => {
  try {
    // ========================
    // Validaciones básicas
    // ========================
    if (!data.personId) {
      return { success: false, error: "Debe seleccionar una persona." };
    }

    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
      return { success: false, error: "El monto debe ser mayor a cero." };
    }

    // ========================
    // Validar documentos
    // ========================
    if (data.documents?.length) {
      const totalDocs = data.documents.reduce(
        (sum, d) => sum + Number(d.amount || 0),
        0
      );

      if (totalDocs <= 0) {
        return {
          success: false,
          error: "El monto aplicado a documentos debe ser mayor a cero.",
        };
      }

      // tolerancia para decimales
      const diff = Math.abs(Number(totalDocs) - amount);
      if (diff > 0.01) {
        return {
          success: false,
          error:
            "El monto de la transacción no coincide con el total aplicado a los documentos.",
        };
      }

      const documentIds = data.documents.map((d) => d.documentId);

      const documents = await prisma.document.findMany({
        where: { id: { in: documentIds } },
        select: { id: true, balance: true },
      });

      const docMap = new Map(
        documents.map((d) => [d.id, Number(d.balance || 0)])
      );

      for (const doc of data.documents) {
        const balance = docMap.get(doc.documentId);

        if (balance === undefined) {
          return {
            success: false,
            error: "Uno de los documentos seleccionados no existe.",
          };
        }

        if (Number(doc.amount) <= 0) {
          return {
            success: false,
            error: "El monto aplicado a un documento debe ser mayor a cero.",
          };
        }

        if (Number(doc.amount) - balance > 0.01) {
          return {
            success: false,
            error:
              "El monto aplicado a un documento supera su saldo pendiente.",
          };
        }
      }
    }

    // ========================
    // Reglas por método (ej. CASH)
    // ========================
    if (data.method === "CASH") {
      if (!data.userId) {
        return {
          success: false,
          error: "El usuario es obligatorio cuando el método es Efectivo.",
        };
      }

      const hasOpenCashSession = await prisma.cashSession.findFirst({
        where: {
          userId: data.userId!,
          status: "OPEN",
        },
      });

      if (!hasOpenCashSession) {
        return {
          success: false,
          error: "No hay una sesión de caja abierta para el usuario.",
        };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error validating transaction data:", error);
    return {
      success: false,
      error:
        error?.message ||
        "Error inesperado al validar los datos de la transacción.",
    };
  }
};

export const createTransaction = async (
  data: CreateTransactionInput,
  tenantId: string
): Promise<{ success: boolean; error?: string; data?: TransactionInput }> => {
  try {
    const resValidation = await validateTransactionData(data);
    if (!resValidation.success) {
      return { success: false, error: resValidation.error };
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
        // Obtener la sesión de caja abierta del usuario
        const cashSession = await tx.cashSession.findFirst({
          where: {
            userId: parsedData.userId!,
            status: "OPEN",
          },
        });
        if (!cashSession) throw new Error("No hay sesión de caja abierta");

        // Obtener la cuenta contable de la persona
        const person = await tx.person.findUnique({
          where: { id: parsedData.personId },
        });
        if (!person) throw new Error("Persona no encontrada");

        const counterAccountId = isIncome
          ? person.accountReceivableId
          : person.accountPayableId;

        if (!counterAccountId)
          throw new Error("Cuenta contable de la persona no configurada");

        const cashMovementData: CreateCashMovement = {
          cashSessionId: cashSession.id,
          cashBoxId: cashSession.cashBoxId,
          transactionId: transaction.id,
          type: isIncome ? "IN" : "OUT",
          category: "SALE",
          amount,
          description: parsedData.description ?? "",
          accountId: counterAccountId,
        };

        // Crear el movimiento de caja dentro de la misma transacción
        await createCashMovementTx(tx, tenantId, cashMovementData);
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

        const bankMov: CreateBankMovement = {
          bankAccountId: parsedData.bankAccountId,
          transactionId: transaction.id,
          type: isIncome ? "IN" : "OUT",
          date: parsedData.issueDate,
          amount,
          description: parsedData.description ?? "",
          details: [
            {
              accountId: counterAccountId,
              amount,
              description: parsedData.description ?? "",
              costCenterId: null,
            },
          ],
        };

        // Crear el movimiento bancario dentro de la misma transacción
        await createBankMovementTx(tx, tenantId, bankMov);
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
    const resValidation = await validateTransactionData(data);
    if (!resValidation.success) {
      return { success: false, error: resValidation.error };
    }

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
