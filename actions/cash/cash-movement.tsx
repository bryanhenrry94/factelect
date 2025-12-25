"use server";
import { prisma } from "@/lib/prisma";
import { CreateJournalEntry } from "@/lib/validations/accounting/journal_entry";
import {
  CashMovement,
  CreateCashMovement,
  UpdateCashMovement,
} from "@/lib/validations/cash/cash_movement";
import { Prisma } from "@/prisma/generated/prisma";
import { createJournalEntryTx } from "../accounting/journal-entry";

export const getAllMovementByCashSessionId = async (
  cashSessionId: string
): Promise<{ success: boolean; error?: string; data?: CashMovement[] }> => {
  try {
    const cashMovements = await prisma.cashMovement.findMany({
      where: {
        cashSessionId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedCashMovements = cashMovements.map((cm) => ({
      ...cm,
      transactionId: cm.transactionId ?? undefined,
      description: cm.description ?? undefined,
      reference: cm.reference ?? undefined,
      accountId: cm.accountId ?? undefined,
    }));

    return { success: true, data: mappedCashMovements };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener los movimientos de caja por sesión",
    };
  }
};

export const getAllCashMovements = async (
  tenantId: string,
  search?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ success: boolean; error?: string; data?: CashMovement[] }> => {
  try {
    const whereClause: any = {
      tenantId,
    };
    if (search) {
      whereClause.OR = [
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const cashMovements = await prisma.cashMovement.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedCashMovements = cashMovements.map((cm) => ({
      ...cm,
      transactionId: cm.transactionId ?? undefined,
      description: cm.description ?? undefined,
      reference: cm.reference ?? undefined,
      accountId: cm.accountId ?? undefined,
    }));

    return { success: true, data: mappedCashMovements };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener los movimientos de caja",
    };
  }
};

export const createCashMovementTx = async (
  tx: Prisma.TransactionClient,
  tenantId: string,
  data: CreateCashMovement
): Promise<CashMovement> => {
  const newCashMovement = await tx.cashMovement.create({
    data: {
      ...data,
      tenantId,
    },
  });

  const cashBox = await tx.cashBox.findUnique({
    where: { id: newCashMovement.cashBoxId },
  });

  if (!cashBox) {
    throw new Error("Caja no encontrada");
  }

  if (!cashBox.accountId) {
    throw new Error("La caja no tiene una cuenta asociada para movimientos");
  }

  // Obtener la transacción asociada si existe
  const transaction = await tx.transaction.findUnique({
    where: { id: newCashMovement.transactionId || "" },
  });

  // Contabiliza movimiento de caja
  const journalEntry: CreateJournalEntry = {
    type: "SALE",
    sourceType: "CASH_MOVEMENT",
    sourceId: newCashMovement.id,
    date: newCashMovement.createdAt,
    description: newCashMovement.description || "Movimiento de caja",
    lines: [
      {
        accountId: cashBox.accountId,
        debit: data.type === "IN" ? newCashMovement.amount : 0,
        credit: data.type === "OUT" ? newCashMovement.amount : 0,
      },
      {
        accountId: newCashMovement.accountId!,
        debit: data.type === "IN" ? 0 : newCashMovement.amount,
        credit: data.type === "OUT" ? 0 : newCashMovement.amount,
        personId: transaction?.personId || undefined,
      },
    ],
  };

  // Crear asiento contable
  await createJournalEntryTx(tx, tenantId, journalEntry);

  return {
    ...newCashMovement,
    cashSessionId: newCashMovement.cashSessionId,
    cashBoxId: newCashMovement.cashBoxId,
    transactionId: newCashMovement.transactionId ?? undefined,
    description: newCashMovement.description ?? undefined,
    accountId: newCashMovement.accountId ?? undefined,
  };
};

export const createCashMovement = async (
  tenantId: string,
  data: CreateCashMovement
): Promise<{ success: boolean; error?: string; data?: CashMovement }> => {
  try {
    const mappedCashMovement = await createCashMovementTx(
      prisma,
      tenantId,
      data
    );

    return { success: true, data: mappedCashMovement };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Error al crear el movimiento de caja",
    };
  }
};

export const updateCashMovement = async (
  id: string,
  data: UpdateCashMovement
): Promise<{ success: boolean; error?: string; data?: CashMovement }> => {
  try {
    const updatedCashMovement = await prisma.cashMovement.updateMany({
      where: {
        id,
      },
      data,
    });

    if (updatedCashMovement.count === 0) {
      return {
        success: false,
        error: "Movimiento de caja no encontrado o sin permisos",
      };
    }

    const cashMovement = await prisma.cashMovement.findUnique({
      where: { id },
    });

    const mappedCashMovement = cashMovement
      ? {
          ...cashMovement,
          transactionId: cashMovement.transactionId ?? undefined,
          description: cashMovement.description ?? undefined,
          reference: cashMovement.reference ?? undefined,
          accountId: cashMovement.accountId ?? undefined,
        }
      : undefined;

    return { success: true, data: mappedCashMovement };
  } catch (error) {
    return {
      success: false,
      error: "Error al actualizar el movimiento de caja",
    };
  }
};

export const deleteCashMovement = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.cashMovement.delete({
      where: {
        id,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Error al eliminar el movimiento de caja",
    };
  }
};

export const registerCashMovement = async (
  tenantId: string,
  data: CreateCashMovement
): Promise<{ success: boolean; error?: string; data?: CashMovement }> => {
  // Aquí podrías agregar lógica adicional, como verificar el estado de la sesión de caja
  return createCashMovement(tenantId, data);
};
