"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateTransactionInput,
  createTransactionSchema,
  TransactionInput,
  UpdateTransactionInput,
} from "@/lib/validations";
import {
  createCashMovementTx,
  updateCashMovementTx,
} from "../cash/cash-movement";
import { CreateCashMovement } from "@/lib/validations/cash/cash_movement";
import { CreateBankMovement } from "@/lib/validations/bank/bank_movement";
import {
  createBankMovementTx,
  updateBankMovementTx,
} from "../bank/bank-movement";
import { Prisma } from "@/prisma/generated/prisma";

export type FilterTransactionsParams = {
  tenantId: string;
  search?: string;
  type?: "INCOME" | "EXPENSE";
  method?: "CASH" | "TRANSFER";
  personId?: string;
  fromDate?: string;
  toDate?: string;
};

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
       * 3. Movimiento Caja + Contabilidad
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

export const updateTransactionTx = async (
  tx: Prisma.TransactionClient,
  tenantId: string,
  transactionId: string,
  data: UpdateTransactionInput
): Promise<TransactionInput> => {
  // Validar que exista
  const current = await tx.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!current) {
    throw new Error("La transacción no existe");
  }

  // Actualizar transacción
  const transaction = await tx.transaction.update({
    where: { id: transactionId },
    include: { documents: true },
    data: {
      personId: data.personId,
      type: data.type,
      method: data.method,
      amount: data.amount,
      issueDate: data.issueDate,
      reference: data.reference || null,
      description: data.description || null,
      bankAccountId: data.bankAccountId || null,
    },
  });

  const isIncome = transaction.type === "INCOME";
  const amount = Number(transaction.amount);

  /* ===========================
   * 2. Aplicar a documentos
   * =========================== */
  if (transaction.documents?.length) {
    // 1️⃣ Obtener documentos afectados (antes de borrar)
    const affectedDocs = await tx.transactionDocument.findMany({
      where: { transactionId },
      select: { documentId: true },
    });

    const affectedIds = new Set<string>([
      ...affectedDocs.map((d) => d.documentId),
      ...transaction.documents.map((d) => d.documentId),
    ]);

    // 2️⃣ Eliminar relaciones anteriores
    await tx.transactionDocument.deleteMany({
      where: { transactionId },
    });

    // 3️⃣ Crear nuevas relaciones
    for (const doc of transaction.documents) {
      await tx.transactionDocument.create({
        data: {
          transactionId: transaction.id,
          documentId: doc.documentId,
          amount: doc.amount,
          tenantId,
        },
      });
    }

    // 4️⃣ Recalcular paidAmount y balance desde cero por documento
    for (const documentId of affectedIds) {
      const [document, agg] = await Promise.all([
        tx.document.findUnique({
          where: { id: documentId },
          select: { total: true },
        }),
        tx.transactionDocument.aggregate({
          where: { documentId },
          _sum: { amount: true },
        }),
      ]);

      if (!document) throw new Error("Documento no encontrado");

      const paid = Number(agg._sum.amount || 0);
      const balance = Number(document.total) - paid;

      await tx.document.update({
        where: { id: documentId },
        data: {
          paidAmount: paid,
          balance: Math.max(balance, 0),
        },
      });
    }
  }

  /* ===========================
   * 3. Movimiento Caja + Contabilidad
   * =========================== */
  if (transaction.method === "CASH") {
    // Obtener la sesión de caja abierta del usuario
    const cashSession = await tx.cashSession.findFirst({
      where: {
        userId: data.userId!,
        status: "OPEN",
      },
    });
    if (!cashSession) throw new Error("No hay sesión de caja abierta");

    // Obtener la cuenta contable de la persona
    const person = await tx.person.findUnique({
      where: { id: transaction.personId },
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
      description: transaction.description ?? "",
      accountId: counterAccountId,
    };

    const existingCashMovement = await tx.cashMovement.findFirst({
      where: { transactionId: transaction.id },
    });

    // Crear el movimiento de caja dentro de la misma transacción
    if (existingCashMovement) {
      await updateCashMovementTx(
        tx,
        tenantId,
        existingCashMovement.id,
        cashMovementData
      );
    } else {
      await createCashMovementTx(tx, tenantId, cashMovementData);
    }
  }

  /* ===========================
   * 4. Movimiento Banco + Contabilidad
   * =========================== */
  if (transaction.method === "TRANSFER") {
    if (!transaction.bankAccountId)
      throw new Error("Cuenta bancaria no especificada");

    const person = await tx.person.findUnique({
      where: { id: transaction.personId },
    });
    if (!person) throw new Error("Persona no encontrada");

    const counterAccountId = isIncome
      ? person.accountReceivableId
      : person.accountPayableId;

    if (!counterAccountId)
      throw new Error("Cuenta contable de la persona no configurada");

    const bankMov: CreateBankMovement = {
      bankAccountId: transaction.bankAccountId,
      transactionId: transaction.id,
      type: isIncome ? "IN" : "OUT",
      date: transaction.issueDate,
      amount,
      description: transaction.description ?? "",
      details: [
        {
          accountId: counterAccountId,
          amount,
          description: transaction.description ?? "",
          costCenterId: null,
        },
      ],
    };

    const existingBankMovement = await tx.bankMovement.findFirst({
      where: { transactionId: transaction.id },
    });

    // Crear el movimiento bancario dentro de la misma transacción
    if (existingBankMovement) {
      await updateBankMovementTx(tx, existingBankMovement.id, bankMov);
    } else {
      await createBankMovementTx(tx, tenantId, bankMov);
    }
  }

  return {
    ...transaction,
    reference: transaction.reference ?? undefined,
    description: transaction.description ?? undefined,
    bankAccountId: transaction.bankAccountId ?? undefined,
    documents: transaction.documents || [],
  };
};

export const updateTransaction = async (
  tenantId: string,
  transactionId: string,
  data: UpdateTransactionInput
): Promise<{ success: boolean; error?: string; data?: TransactionInput }> => {
  try {
    const transaction = await prisma.$transaction((tx) =>
      updateTransactionTx(tx, tenantId, transactionId, data)
    );

    return { success: true, data: transaction };
  } catch (error: any) {
    console.error("Error updating transaction:", error);
    return {
      success: false,
      error: error.message || "Error al actualizar la transacción",
    };
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
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Validar que exista
      const existing = await tx.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!existing) {
        throw new Error("La transacción no existe");
      }

      // 2️⃣ Obtener documentos asociados ANTES de borrar
      const transactionDocuments = await tx.transactionDocument.findMany({
        where: { transactionId },
      });

      // 3️⃣ Obtener movimientos de caja asociados
      const cashMovements = await tx.cashMovement.findMany({
        where: { transactionId },
      });

      for (const cm of cashMovements) {
        if (cm.journalEntryId) {
          await tx.journalEntry.delete({
            where: { id: cm.journalEntryId },
          });
        }

        await tx.cashMovement.delete({
          where: { id: cm.id },
        });
      }

      // 4️⃣ Obtener movimientos bancarios asociados
      const bankMovements = await tx.bankMovement.findMany({
        where: { transactionId },
      });

      for (const bm of bankMovements) {
        if (bm.journalEntryId) {
          await tx.journalEntry.delete({
            where: { id: bm.journalEntryId },
          });
        }

        await tx.bankMovementDetail.deleteMany({
          where: { bankMovementId: bm.id },
        });

        await tx.bankMovement.delete({
          where: { id: bm.id },
        });
      }

      // 5️⃣ Recalcular saldos de documentos
      for (const txDoc of transactionDocuments) {
        const document = await tx.document.findUnique({
          where: { id: txDoc.documentId },
          select: { total: true, paidAmount: true },
        });

        if (document) {
          const paid = Number(document.paidAmount || 0) - Number(txDoc.amount);
          const safePaid = Math.max(paid, 0);
          const balance = Number(document.total) - safePaid;

          await tx.document.update({
            where: { id: txDoc.documentId },
            data: {
              paidAmount: safePaid,
              balance: Math.max(balance, 0),
            },
          });
        }
      }

      // 6️⃣ Eliminar asociaciones con documentos
      await tx.transactionDocument.deleteMany({
        where: { transactionId },
      });

      // 7️⃣ Eliminar la transacción
      await tx.transaction.delete({
        where: { id: transactionId },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    return {
      success: false,
      error: error.message || "Error deleting transaction",
    };
  }
};
