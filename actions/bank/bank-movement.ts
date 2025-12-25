"use server";
import { prisma } from "@/lib/prisma";
import { CreateJournalEntryLine } from "@/lib/validations/accounting/journal-entry-line";
import { CreateJournalEntry } from "@/lib/validations/accounting/journal_entry";
import { BankMovement } from "@/lib/validations/bank/bank_movement";
import { Prisma } from "@/prisma/generated/prisma";
import {
  createJournalEntryTx,
  updateJournalEntryTx,
} from "../accounting/journal-entry";

export const getAllBankMovements = async (
  tenantId: string,
  search?: string,
  dateFrom?: string,
  dateTo?: string
) => {
  try {
    const where: any = { tenantId };

    if (search?.trim()) {
      where.description = {
        contains: search.trim(),
        mode: "insensitive",
      };
    }

    if (dateFrom || dateTo) {
      where.date = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const bankMovements = await prisma.bankMovement.findMany({
      where,
      include: { bankAccount: true },
      orderBy: { date: "desc" },
    });

    const formatted = bankMovements.map((m) => ({
      ...m,
      transactionId: m.transactionId || undefined,
      description: m.description ?? "",
      journalEntryId: m.journalEntryId ?? undefined,
      reference: m.reference ?? "",
      account: m.bankAccount
        ? {
            id: m.bankAccount.id,
            name: m.bankAccount.bankName,
            number: m.bankAccount.accountNumber,
          }
        : undefined,
    }));

    return { success: true, data: formatted };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Error fetching bank movements" };
  }
};

export const deleteBankMovement = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Obtener movimiento
      const movement = await tx.bankMovement.findUnique({
        where: { id },
        select: {
          id: true,
          transactionId: true,
          journalEntryId: true,
        },
      });

      if (!movement) {
        throw new Error("Movimiento bancario no encontrado");
      }

      // 2️⃣ Validar que no venga de una transacción
      if (movement.transactionId) {
        throw new Error(
          "No se puede eliminar un movimiento asociado a una transacción"
        );
      }

      // 3️⃣ Eliminar asiento contable asociado
      if (movement.journalEntryId) {
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: movement.journalEntryId },
        });

        await tx.journalEntry.delete({
          where: { id: movement.journalEntryId },
        });
      }

      // 4️⃣ Eliminar detalles del movimiento
      await tx.bankMovementDetail.deleteMany({
        where: { bankMovementId: id },
      });

      // 5️⃣ Eliminar el movimiento bancario
      await tx.bankMovement.delete({
        where: { id },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting bank movement:", error);
    return {
      success: false,
      error: error.message || "Error deleting bank movement",
    };
  }
};

export const createBankMovementTx = async (
  tx: Prisma.TransactionClient,
  tenantId: string,
  data: Omit<BankMovement, "id" | "tenantId" | "createdAt">
): Promise<BankMovement> => {
  const newMovement = await tx.bankMovement.create({
    data: {
      tenantId,
      bankAccountId: data.bankAccountId,
      transactionId: data.transactionId || null,
      type: data.type,
      date: data.date,
      amount: data.amount,
      description: data.description || null,
      reference: data.reference || null,
    },
  });

  if (data.details?.length) {
    await Promise.all(
      data.details.map((detail) =>
        tx.bankMovementDetail.create({
          data: {
            tenantId,
            bankMovementId: newMovement.id,
            accountId: detail.accountId,
            costCenterId: detail.costCenterId || null,
            description: detail.description || null,
            amount: detail.amount,
          },
        })
      )
    );
  }

  // Contabilizar los detalles del movimiento bancario aquí si es necesario
  const journal: CreateJournalEntry = {
    date: newMovement.date,
    type: "DEPOSIT",
    description: newMovement.description ?? "",
    sourceType: "BANK_MOVEMENT",
    sourceId: newMovement.id,
    lines: [],
  };

  const bankAccount = await tx.bankAccount.findUnique({
    where: { id: newMovement.bankAccountId },
  });
  if (!bankAccount)
    throw new Error("Cuenta bancaria no encontrada para la transacción");

  /* Asientos contables */
  // 🏦 Banco
  const lineBank: CreateJournalEntryLine = {
    accountId: bankAccount.accountId!,
    debit: newMovement.type === "IN" ? newMovement.amount : 0,
    credit: newMovement.type === "OUT" ? newMovement.amount : 0,
  };

  journal.lines.push(lineBank);

  // 📄 Detalles del movimiento bancario
  if (data.details) {
    data.details.map(async (detail) => {
      const lineDetail: CreateJournalEntryLine = {
        accountId: detail.accountId,
        debit: newMovement.type === "OUT" ? detail.amount : 0,
        credit: newMovement.type === "IN" ? detail.amount : 0,
      };
      journal.lines.push(lineDetail);
    });
  }

  // Crear asiento contable
  await createJournalEntryTx(tx, tenantId, journal);

  return {
    ...newMovement,
    transactionId: newMovement.transactionId || undefined,
    description: newMovement.description || "",
    reference: newMovement.reference || "",
    journalEntryId: newMovement.journalEntryId ?? undefined,
  };
};

export const createBankMovement = async (
  tenantId: string,
  data: Omit<BankMovement, "id" | "tenantId" | "createdAt">
): Promise<{ success: boolean; error?: string; data?: BankMovement }> => {
  try {
    console.log("Creating bank movement with data:", data);

    const movement = await prisma.$transaction((tx) =>
      createBankMovementTx(tx, tenantId, data)
    );

    return { success: true, data: movement };
  } catch (error) {
    console.error("Error creating bank movement:", error);
    return { success: false, error: "Error creating bank movement" };
  }
};

export const updateBankMovementTx = async (
  tx: Prisma.TransactionClient,
  id: string,
  data: Partial<Omit<BankMovement, "id" | "tenantId" | "createdAt">>
): Promise<{ success: boolean; error?: string; data?: BankMovement }> => {
  try {
    const updatedMovement = await tx.bankMovement.update({
      where: { id },
      data: {
        bankAccountId: data.bankAccountId,
        transactionId: data.transactionId || null,
        type: data.type,
        date: data.date,
        amount: data.amount,
        description: data.description,
        reference: data.reference || null,
      },
    });

    // elimina detalles existentes si es necesario
    if (data.details) {
      await tx.bankMovementDetail.deleteMany({
        where: { bankMovementId: id },
      });

      // registrar nuevos detalles
      data.details.forEach(async (detail) => {
        await tx.bankMovementDetail.create({
          data: {
            tenantId: updatedMovement.tenantId,
            bankMovementId: updatedMovement.id,
            accountId: detail.accountId,
            costCenterId: detail.costCenterId || null,
            description: detail.description || null,
            amount: detail.amount,
          },
        });
      });
    }

    // Contabilizar los detalles del movimiento bancario aquí si es necesario
    const journal: CreateJournalEntry = {
      date: updatedMovement.date,
      type: "DEPOSIT",
      description: updatedMovement.description ?? "",
      sourceType: "BANK_MOVEMENT",
      sourceId: updatedMovement.id,
      lines: [],
    };

    const bankAccount = await tx.bankAccount.findUnique({
      where: { id: updatedMovement.bankAccountId },
    });
    if (!bankAccount)
      throw new Error("Cuenta bancaria no encontrada para la transacción");

    /* Asientos contables */
    // 🏦 Banco
    const lineBank: CreateJournalEntryLine = {
      accountId: bankAccount.accountId!,
      debit: updatedMovement.type === "IN" ? updatedMovement.amount : 0,
      credit: updatedMovement.type === "OUT" ? updatedMovement.amount : 0,
    };

    journal.lines.push(lineBank);

    // 📄 Detalles del movimiento bancario
    if (data.details) {
      data.details.map(async (detail) => {
        const lineDetail: CreateJournalEntryLine = {
          accountId: detail.accountId,
          debit: updatedMovement.type === "OUT" ? detail.amount : 0,
          credit: updatedMovement.type === "IN" ? detail.amount : 0,
        };
        journal.lines.push(lineDetail);
      });
    }

    const existingJournalEntry = await tx.journalEntry.findFirst({
      where: {
        id: updatedMovement.journalEntryId || "",
      },
    });

    // Crear asiento contable
    if (existingJournalEntry) {
      await updateJournalEntryTx(tx, existingJournalEntry.id, journal);
    } else {
      await createJournalEntryTx(tx, updatedMovement.tenantId, journal);
    }

    if (!updatedMovement) {
      return {
        success: false,
        error: "Bank movement not found or not updated",
      };
    }
    const movement = await prisma.bankMovement.findUnique({
      where: { id },
    });

    const formattedMovement = movement
      ? {
          ...movement,
          transactionId: movement.transactionId || undefined,
          description: movement.description || "",
          reference: movement.reference || "",
          amount: movement.amount,
          journalEntryId: movement.journalEntryId ?? undefined,
        }
      : null;

    return { success: true, data: formattedMovement! };
  } catch (error) {
    console.error("Error updating bank movement:", error);
    return { success: false, error: "Error updating bank movement" };
  }
};

export const updateBankMovement = async (
  id: string,
  data: Partial<Omit<BankMovement, "id" | "tenantId" | "createdAt">>
): Promise<{ success: boolean; error?: string; data?: BankMovement }> => {
  try {
    const result = await prisma.$transaction((tx) =>
      updateBankMovementTx(tx, id, data)
    );
    return result;
  } catch (error) {
    console.error("Error updating bank movement:", error);
    return { success: false, error: "Error updating bank movement" };
  }
};

export const getBankMovementById = async (
  id: string
): Promise<{ success: boolean; error?: string; data?: BankMovement }> => {
  try {
    const movement = await prisma.bankMovement.findUnique({
      where: { id },
      include: { bankAccount: true, details: true },
    });

    if (!movement) {
      return { success: false, error: "Bank movement not found" };
    }

    const formattedMovement = {
      ...movement,
      transactionId: movement.transactionId || undefined,
      description: movement.description || "",
      journalEntryId: movement.journalEntryId ?? undefined,
      reference: movement.reference || "",
      details: movement.details.map((detail) => ({
        ...detail,
        description: detail.description || "",
      })),
      account: movement.bankAccount
        ? {
            id: movement.bankAccount.id,
            name: movement.bankAccount.bankName,
            number: movement.bankAccount.accountNumber,
          }
        : undefined,
    };

    return { success: true, data: formattedMovement };
  } catch (error) {
    console.error("Error fetching bank movement by ID:", error);
    return { success: false, error: "Error fetching bank movement" };
  }
};
