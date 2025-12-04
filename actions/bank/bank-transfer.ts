"use server";
import { prisma } from "@/lib/prisma";
import {
  BankTransfer,
  BankTransferWithAccount,
  CreateBankTransfer,
  UpdateBankTransfer,
} from "@/lib/validations/bank/bank_transfer";

export const getAllBankTransfers = async (
  tenantId: string,
  search?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  success: boolean;
  data?: BankTransferWithAccount[];
  error?: string;
}> => {
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

    const bankTransfers = await prisma.bankTransfer.findMany({
      where,
      include: {
        movementOut: { include: { bankAccount: true } },
        movementIn: { include: { bankAccount: true } },
      },
      orderBy: { date: "desc" },
    });

    const formatted: BankTransferWithAccount[] = bankTransfers.map((m) => ({
      ...m,
      description: m.description ?? "",
      reference: m.reference ?? "",
      amount:
        typeof m.amount === "object" && "toNumber" in m.amount
          ? m.amount.toNumber()
          : m.amount,
      fromAccountId: m.fromAccountId ?? "",
      toAccountId: m.toAccountId ?? "",
      movementOutId: m.movementOutId ?? "",
      movementInId: m.movementInId ?? "",
      fromAccount: m.movementOut?.bankAccount
        ? {
            id: m.movementOut?.bankAccount.id,
            name: m.movementOut?.bankAccount.bankName,
            accountNumber: m.movementOut?.bankAccount.accountNumber,
          }
        : null,
      toAccount: m.movementIn?.bankAccount
        ? {
            id: m.movementIn?.bankAccount.id,
            name: m.movementIn.bankAccount.bankName,
            accountNumber: m.movementIn.bankAccount.accountNumber,
          }
        : null,
    }));

    return { success: true, data: formatted };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Error fetching bank movements" };
  }
};

export const deleteBankTransfer = async (id: string) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener la transferencia
      const transfer = await tx.bankTransfer.findUnique({
        where: { id },
      });

      if (!transfer) {
        throw new Error("Transfer not found");
      }

      // 2. Eliminar movimientos asociados (primero OUT luego IN)
      if (transfer.movementOutId) {
        await tx.bankMovement.deleteMany({
          where: {
            id: {
              in: [transfer.movementOutId].filter(Boolean),
            },
          },
        });
      }

      if (transfer.movementInId) {
        await tx.bankMovement.deleteMany({
          where: {
            id: {
              in: [transfer.movementInId].filter(Boolean),
            },
          },
        });
      }

      // 3. Eliminar transferencia
      await tx.bankTransfer.delete({
        where: { id },
      });

      return true;
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting bank transfer:", error);
    return { success: false, error: "Error deleting bank transfer" };
  }
};

export const createBankTransfer = async (
  tenantId: string,
  data: CreateBankTransfer
): Promise<{ success: boolean; error?: string; data?: BankTransfer }> => {
  try {
    // Create movementOut (egreso)
    const movementOut = await prisma.bankMovement.create({
      data: {
        tenantId,
        bankAccountId: data.fromAccountId,
        type: "DEBIT",
        date: data.date,
        amount: data.amount,
        description: data.description,
        reference: data.reference || null,
      },
    });

    // Create movementIn (ingreso)
    const movementIn = await prisma.bankMovement.create({
      data: {
        tenantId,
        bankAccountId: data.toAccountId,
        type: "CREDIT",
        date: data.date,
        amount: data.amount,
        description: data.description,
        reference: data.reference || null,
      },
    });

    // Create bank transfer with movement IDs
    const newTransfer = await prisma.bankTransfer.create({
      data: {
        tenantId,
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        date: data.date,
        description: data.description,
        reference: data.reference || null,
        movementOutId: movementOut.id,
        movementInId: movementIn.id,
      },
    });

    // Format amount to number for return type compatibility
    const formattedTransfer: BankTransfer = {
      ...newTransfer,
      amount:
        typeof newTransfer.amount === "object" &&
        "toNumber" in newTransfer.amount
          ? newTransfer.amount.toNumber()
          : newTransfer.amount,
      movementOutId: newTransfer.movementOutId || "",
      movementInId: newTransfer.movementInId || "",
    };

    return { success: true, data: formattedTransfer };
  } catch (error) {
    console.error("Error creating bank movement:", error);
    return { success: false, error: "Error creating bank movement" };
  }
};

export const updateBankTransfer = async (
  id: string,
  data: Partial<UpdateBankTransfer>
): Promise<{ success: boolean; error?: string; data?: BankTransfer }> => {
  console.log("updateBankTransfer data:", data);

  try {
    const updatedMovement = await prisma.bankTransfer.update({
      where: { id },
      data: {
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        date: data.date,
        amount: data.amount,
        description: data.description,
        reference: data.reference || null,
      },
    });

    // actualiza los movimientos asociados si es necesario
    if (data.movementOutId) {
      await prisma.bankMovement.update({
        where: { id: data.movementOutId },
        data: {
          bankAccountId: data.fromAccountId,
          type: "DEBIT",
          date: data.date,
          amount: data.amount,
          description: data.description,
          reference: data.reference || null,
        },
      });
    }

    if (data.movementInId) {
      await prisma.bankMovement.update({
        where: { id: data.movementInId },
        data: {
          bankAccountId: data.toAccountId,
          type: "CREDIT",
          date: data.date,
          amount: data.amount,
          description: data.description,
          reference: data.reference || null,
        },
      });
    }

    const formattedMovement = {
      ...updatedMovement,
      description: updatedMovement.description || "",
      reference: updatedMovement.reference || "",
      amount:
        typeof updatedMovement.amount === "object" &&
        "toNumber" in updatedMovement.amount
          ? updatedMovement.amount.toNumber()
          : updatedMovement.amount,
      movementOutId: updatedMovement.movementOutId || "",
      movementInId: updatedMovement.movementInId || "",
    };

    return { success: true, data: formattedMovement };
  } catch (error) {
    console.error("Error updating bank movement:", error);
    return { success: false, error: "Error updating bank movement" };
  }
};
