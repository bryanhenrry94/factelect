"use server";
import { prisma } from "@/lib/prisma";
import { Account, CreateAccount } from "@/lib/validations";

export const getAccounts = async (
  tenantId: string
): Promise<{ success: boolean; data?: Account[]; error?: string }> => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        code: "asc",
      },
    });

    const mappedAccounts = accounts.map((account) => ({
      ...account,
      accountType: account.accountType as Account["accountType"],
    }));

    return { success: true, data: mappedAccounts };
  } catch (error) {
    return { success: false, error: "Error al obtener las cuentas contables" };
  }
};

export const createAccount = async (
  tenantId: string,
  accountData: CreateAccount
): Promise<{ success: boolean; data?: Account; error?: string }> => {
  try {
    const newAccount = await prisma.account.create({
      data: {
        ...accountData,
        tenantId,
      },
    });

    return { success: true, data: newAccount };
  } catch (error) {
    return { success: false, error: "Error al crear la cuenta contable" };
  }
};

export const updateAccount = async (
  accountId: string,
  accountData: Partial<CreateAccount>
): Promise<{ success: boolean; data?: Account; error?: string }> => {
  try {
    const updatedAccount = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: accountData,
    });

    return { success: true, data: updatedAccount };
  } catch (error) {
    return { success: false, error: "Error al actualizar la cuenta contable" };
  }
};

export const deleteAccount = async (
  accountId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.account.delete({
      where: {
        id: accountId,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar la cuenta contable" };
  }
};
