"use server";
import { prisma } from "@/lib/prisma";
import { CashSession } from "@/lib/validations/cash/cash_session";

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

    const mappedSession = session
      ? {
          ...session,
          totalIn: session.totalIn === null ? undefined : session.totalIn,
          totalOut: session.totalOut === null ? undefined : session.totalOut,
          closingAmount:
            session.closingAmount === null ? undefined : session.closingAmount,
          difference:
            session.difference === null ? undefined : session.difference,
          notes: session.notes === null ? undefined : session.notes,
        }
      : null;

    return { success: true, data: mappedSession };
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
): Promise<{ success: boolean; error?: string; data?: CashSession | null }> {
  try {
    // valida que la caja no tenga una sesion abierta
    const cashBoxOpenSession = await prisma.cashSession.findFirst({
      where: {
        tenantId,
        cashBoxId,
        status: "OPEN",
      },
    });

    if (cashBoxOpenSession) {
      return {
        success: false,
        error: "La caja ya tiene una sesión de caja abierta",
      };
    }

    // valida que no exista una sesion abierta para el usuario y caja
    const existingSession = await prisma.cashSession.findFirst({
      where: {
        tenantId,
        cashBoxId,
        userId,
        status: "OPEN",
      },
    });

    if (existingSession) {
      return {
        success: false,
        error: "Ya existe una sesión de caja abierta para este usuario y caja",
      };
    }

    // Valida que el usuario no tenga otra sesion abierta en otra caja
    const userOpenSession = await prisma.cashSession.findFirst({
      where: {
        tenantId,
        userId,
        status: "OPEN",
      },
    });

    if (userOpenSession) {
      return {
        success: false,
        error: "El usuario ya tiene una sesión de caja abierta",
      };
    }

    const newSession = await prisma.cashSession.create({
      data: {
        tenantId,
        cashBoxId,
        userId,
        openedAt: new Date(),
        initialAmount: initialAmount,
        closingAmount: 0,
        totalIn: 0,
        totalOut: 0,
        status: "OPEN",
      },
    });

    const mappedSession = newSession
      ? {
          ...newSession,
          totalIn: newSession.totalIn === null ? undefined : newSession.totalIn,
          totalOut:
            newSession.totalOut === null ? undefined : newSession.totalOut,
          closingAmount:
            newSession.closingAmount === null
              ? undefined
              : newSession.closingAmount,
          difference:
            newSession.difference === null ? undefined : newSession.difference,
          notes: newSession.notes === null ? undefined : newSession.notes,
        }
      : null;
    return { success: true, data: mappedSession };
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
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.cashSession.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.status !== "OPEN") {
        return {
          success: false,
          error: "La sesión de caja no existe o ya está cerrada",
        };
      }

      // 🔢 Calcular totales en BD
      const totals = await tx.cashMovement.groupBy({
        by: ["type"],
        where: { cashSessionId: sessionId },
        _sum: { amount: true },
      });

      const totalIn = totals.find((t) => t.type === "IN")?._sum.amount ?? 0;
      const totalOut = totals.find((t) => t.type === "OUT")?._sum.amount ?? 0;

      const expected = session.initialAmount + totalIn - totalOut;

      const difference = Number((expected - closingAmount).toFixed(2));

      // ⚠️ Tolerancia por decimales
      if (Math.abs(difference) > 0.01) {
        return {
          success: false,
          error: `La diferencia debe ser 0 para cerrar la sesión. Diferencia actual: ${difference}`,
        };
      }

      const closedSession = await tx.cashSession.update({
        where: { id: sessionId },
        data: {
          closedAt: new Date(),
          totalIn,
          totalOut,
          closingAmount,
          difference,
          status: "CLOSED",
        },
      });

      return { success: true, data: closedSession };
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const mappedResult = result.data
      ? {
          ...result.data,
          totalIn:
            result.data.totalIn === null ? undefined : result.data.totalIn,
          totalOut:
            result.data.totalOut === null ? undefined : result.data.totalOut,
          closingAmount:
            result.data.closingAmount === null
              ? undefined
              : result.data.closingAmount,
          difference:
            result.data.difference === null
              ? undefined
              : result.data.difference,
          notes: result.data.notes === null ? undefined : result.data.notes,
        }
      : undefined;

    return { success: true, data: mappedResult };
  } catch (error) {
    console.error("Error closing cash session:", error);
    return {
      success: false,
      error: "Ocurrió un error al cerrar la sesión de caja",
    };
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

    const mappedSessions = sessions.map((session) => ({
      ...session,
      totalIn: session.totalIn === null ? undefined : session.totalIn,
      totalOut: session.totalOut === null ? undefined : session.totalOut,
      closingAmount:
        session.closingAmount === null ? undefined : session.closingAmount,
      difference: session.difference === null ? undefined : session.difference,
      notes: session.notes === null ? undefined : session.notes,
    }));

    return { success: true, data: mappedSessions };
  } catch (error) {
    console.error("Error fetching cash sessions:", error);
    return { success: false, error: "Error fetching cash sessions" };
  }
};
