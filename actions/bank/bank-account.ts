"use server";
import { prisma } from "@/lib/prisma";
import {
  BankAccount,
  CreateBankAccount,
} from "@/lib/validations/bank/bank_account";

export const createBankAccount = async (
  tenantId: string,
  data: CreateBankAccount
) => {
  try {
    const bankAccount = await prisma.bankAccount.create({
      data: {
        ...data,
        tenantId,
      },
    });
    return { success: true, data: bankAccount };
  } catch (error) {
    console.error("Error creating bank account:", error);
    return { success: false, error: "Error creating bank account" };
  }
};

export const updateBankAccount = async (
  id: string,
  data: CreateBankAccount
) => {
  try {
    const bankAccount = await prisma.bankAccount.update({
      where: { id },
      data,
    });
    return { success: true, data: bankAccount };
  } catch (error) {
    console.error("Error updating bank account:", error);
    return { success: false, error: "Error updating bank account" };
  }
};

export const deleteBankAccount = async (id: string) => {
  try {
    // valida si la cuenta bancaria tiene movimientos asociados
    const hasBankMovements = await prisma.bankMovement.findFirst({
      where: { bankAccountId: id },
    });
    if (hasBankMovements) {
      return {
        success: false,
        error:
          "No se puede eliminar la cuenta bancaria porque tiene movimientos asociados.",
      };
    }
    
    await prisma.bankAccount.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return { success: false, error: "Error deleting bank account" };
  }
};

export const getAllBankAccounts = async (
  tenantId: string,
  search?: string
): Promise<{ success: boolean; data?: BankAccount[]; error?: string }> => {
  try {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        tenantId,
        bankName: search
          ? {
              contains: search,
              mode: "insensitive",
            }
          : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: bankAccounts };
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return { success: false, error: "Error fetching bank accounts" };
  }
};
