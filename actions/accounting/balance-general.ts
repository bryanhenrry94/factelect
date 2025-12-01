"use server";

import { prisma } from "@/lib/prisma";

function normalizeDateRange(dateFrom: Date, dateTo: Date) {
  const from = new Date(dateFrom);
  from.setHours(0, 0, 0, 0);

  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export type AccountBalance = {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  balance: number;
  accounts?: AccountBalance[];
};

export async function getBalanceGeneral(params: {
  costCenter?: string;
  dateFrom: Date;
  dateTo: Date;
}): Promise<{
  success: boolean;
  data?: AccountBalance[];
  error?: string;
}> {
  const { costCenter, dateFrom, dateTo } = params;

  try {
    // Normalizar fechas
    const { from: dateFromStart, to: dateToEnd } = normalizeDateRange(
      dateFrom,
      dateTo
    );

    // 1️⃣ Obtener todas las cuentas relevantes (solo activos, pasivos, patrimonio)
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        accountType: { in: ["ASSET", "LIABILITY", "EQUITY"] },
      },
      orderBy: { code: "asc" },
    });

    // Si no hay cuentas, no hay reporte
    if (!accounts.length) {
      return { success: true, data: [] };
    }

    const results: AccountBalance[] = [];

    for (const acc of accounts) {
      // -------------------------------------------------------------
      // 2️⃣ SALDO INICIAL: movimientos ANTES de dateFromStart
      // -------------------------------------------------------------
      const previousLines = await prisma.ledgerEntry.findMany({
        where: {
          accountId: acc.id,
          journalEntry: {
            date: { lt: dateFromStart },
          },
          ...(costCenter ? { costCenterId: costCenter } : {}),
        },
      });

      const openingBalance = previousLines.reduce((total, line) => {
        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);
        return total + (debit - credit);
      }, 0);

      // -------------------------------------------------------------
      // 3️⃣ MOVIMIENTOS dentro del rango
      // -------------------------------------------------------------
      const periodLines = await prisma.ledgerEntry.findMany({
        where: {
          accountId: acc.id,
          journalEntry: {
            date: {
              gte: dateFromStart,
              lte: dateToEnd,
            },
          },
          ...(costCenter ? { costCenterId: costCenter } : {}),
        },
      });

      const movementsTotal = periodLines.reduce((total, line) => {
        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);
        return total + (debit - credit);
      }, 0);

      // Saldo final de la cuenta
      const finalBalance = openingBalance + movementsTotal;

      results.push({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.accountType, // ASSET, LIABILITY, EQUITY
        balance: finalBalance,
      });
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("Error generating balance general:", error);
    return { success: false, error: "Error generating balance general" };
  }
}
