"use server";
import { prisma } from "@/lib/prisma";
import { BankMovement } from "@/lib/validations/bank/bank_movement";

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
    await prisma.bankMovement.deleteMany({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting bank movement:", error);
    return { success: false, error: "Error deleting bank movement" };
  }
};

export const createBankMovement = async (
  tenantId: string,
  data: Omit<BankMovement, "id" | "tenantId" | "createdAt">
): Promise<{ success: boolean; error?: string; data?: BankMovement }> => {
  try {
    console.log("Creating bank movement with data:", data);

    const newMovement = await prisma.bankMovement.create({
      data: {
        tenantId,
        bankAccountId: data.bankAccountId,
        type: data.type,
        date: data.date,
        amount: data.amount,
        description: data.description,
        reference: data.reference || null,
      },
    });

    // registrar detalles si es necesario
    data.details?.forEach(async (detail) => {
      await prisma.bankMovementDetail.create({
        data: {
          tenantId,
          bankMovementId: newMovement.id,
          accountId: detail.accountId,
          costCenterId: detail.costCenterId || null,
          description: detail.description || null,
          amount: detail.amount,
        },
      });
    });

    const formattedMovement = {
      ...newMovement,
      description: newMovement.description || "",
      reference: newMovement.reference || "",
      amount: newMovement.amount,
      journalEntryId: newMovement.journalEntryId ?? undefined,
    };

    return { success: true, data: formattedMovement };
  } catch (error) {
    console.error("Error creating bank movement:", error);
    return { success: false, error: "Error creating bank movement" };
  }
};

export const updateBankMovement = async (
  id: string,
  data: Partial<Omit<BankMovement, "id" | "tenantId" | "createdAt">>
): Promise<{ success: boolean; error?: string; data?: BankMovement }> => {
  try {
    const updatedMovement = await prisma.bankMovement.update({
      where: { id },
      data: {
        bankAccountId: data.bankAccountId,
        type: data.type,
        date: data.date,
        amount: data.amount,
        description: data.description,
        reference: data.reference || null,
      },
    });

    // elimina detalles existentes si es necesario
    if (data.details) {
      await prisma.bankMovementDetail.deleteMany({
        where: { bankMovementId: id },
      });

      // registrar nuevos detalles
      data.details.forEach(async (detail) => {
        await prisma.bankMovementDetail.create({
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
