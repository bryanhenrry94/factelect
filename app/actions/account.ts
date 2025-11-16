"use server";
import { prisma } from "@/lib/prisma";
import { Account, CreateAccount } from "@/lib/validations";

export const getAccounts = async (
  tenantId: string
): Promise<{ success: boolean; error?: string; data: Account[] }> => {
  try {
    const accounts = await prisma.account.findMany({
      where: { tenantId },
    });

    const formattedAccounts = accounts.map((account) => ({
      ...account,
      type: account.type as "BANK" | "CASH" | "CREDIT_CARD",
      createdAt: account.createdAt,
      balance: Number(account.balance),
    }));

    return {
      success: true,
      data: formattedAccounts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener cuentas",
      data: [],
    };
  }
};

export const createAccount = async (
  data: CreateAccount,
  tenantId: string
): Promise<{ success: boolean; error?: string; data?: Account }> => {
  try {
    const newAccount = await prisma.account.create({
      data: {
        ...data,
        tenantId,
      },
    });

    const formattedAccount = {
      ...newAccount,
      type: newAccount.type as "BANK" | "CASH" | "CREDIT_CARD",
      createdAt: newAccount.createdAt,
      balance: Number(newAccount.balance),
    };

    return { success: true, data: formattedAccount };
  } catch (error) {
    return { success: false, error: "Error al crear cuenta" };
  }
};

export const deleteAccount = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // validar si tiene transacciones asociadas antes de eliminar
    const associatedTransactions = await prisma.transaction.findFirst({
      where: { accountId: id },
    });

    if (associatedTransactions) {
      return {
        success: false,
        error: "No se puede eliminar la cuenta con transacciones asociadas",
      };
    }

    await prisma.account.deleteMany({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error en eliminar cuenta" };
  }
};

export const updateAccount = async (
  id: string,
  data: Partial<CreateAccount>
): Promise<{ success: boolean; error?: string; data?: Account }> => {
  try {
    const updatedAccount = await prisma.account.update({
      where: { id },
      data,
    });

    const formattedAccount = {
      ...updatedAccount,
      type: updatedAccount.type as "BANK" | "CASH" | "CREDIT_CARD",
      createdAt: updatedAccount.createdAt,
      balance: Number(updatedAccount.balance),
    };

    return { success: true, data: formattedAccount };
  } catch (error) {
    return { success: false, error: "Error al actualizar cuenta" };
  }
};
