"use server";
import { prisma } from "@/lib/prisma";
import { CashSession } from "@/lib/validations/cash_session";

export async function getOpenCashSession(
  tenantId: string,
  userId: string
): Promise<{ success: boolean; error?: string; data?: CashSession | null }> {
  try {
    const session = await prisma.cashSession.findFirst({
      where: {
        tenantId,
        userId,
        status: "OPEN",
      },
    });

    return { success: true, data: session };
  } catch (error) {
    console.error("Error fetching open cash session:", error);
    return { success: false, error: "Error fetching open cash session" };
  }
}

export async function openCashSession(
  tenantId: string,
  cashBoxId: string,
  userId: string,
  initialAmount: number
): Promise<{ success: boolean; error?: string; data?: CashSession }> {
  try {
    const newSession = await prisma.cashSession.create({
      data: {
        tenantId,
        cashBoxId,
        userId,
        openedAt: new Date(),
        initialAmount,
        status: "OPEN",
      },
    });

    return { success: true, data: newSession };
  } catch (error) {
    console.error("Error opening cash session:", error);
    return { success: false, error: "Error opening cash session" };
  }
}

export async function closeCashSession(
  sessionId: string,
  closingAmount: number
): Promise<{ success: boolean; error?: string; data?: CashSession }> {
  try {
    const closedSession = await prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        closedAt: new Date(),
        closingAmount,
        status: "CLOSED",
      },
    });

    return { success: true, data: closedSession };
  } catch (error) {
    console.error("Error closing cash session:", error);
    return { success: false, error: "Error closing cash session" };
  }
}

export const getAllCashSessions = async (
  tenantId: string
): Promise<{ success: boolean; error?: string; data?: CashSession[] }> => {
  try {
    const sessions = await prisma.cashSession.findMany({
      where: { tenantId },
      orderBy: { openedAt: "desc" },
    });

    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error fetching cash sessions:", error);
    return { success: false, error: "Error fetching cash sessions" };
  }
};
