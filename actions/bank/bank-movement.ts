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
      reference: m.reference ?? "",
      accountId: m.accountId ?? "",
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
        accountId: data.accountId || null,
      },
    });

    const formattedMovement = {
      ...newMovement,
      description: newMovement.description || "",
      reference: newMovement.reference || "",
      accountId: newMovement.accountId || "",
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
        accountId: data.accountId || null,
      },
    });

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
          accountId: movement.accountId || "",
        }
      : null;

    return { success: true, data: formattedMovement! };
  } catch (error) {
    console.error("Error updating bank movement:", error);
    return { success: false, error: "Error updating bank movement" };
  }
};
