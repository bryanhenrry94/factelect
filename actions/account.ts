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
