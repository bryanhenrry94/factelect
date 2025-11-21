"use server";
import { prisma } from "@/lib/prisma";
import { Account } from "@/lib/validations";

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
      type: account.type as Account["type"],
    }));

    return { success: true, data: mappedAccounts };
  } catch (error) {
    return { success: false, error: "Error al obtener las cuentas contables" };
  }
};
