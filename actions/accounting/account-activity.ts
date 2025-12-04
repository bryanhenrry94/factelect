"use server";

import { prisma } from "@/lib/prisma";

export interface AccountActivityRow {
  id: string;
  date: Date;
  description: string;
  debit: number;
  credit: number;
  costCenter: string | null;
  balance: number;
}

// Normaliza fecha: inicio y fin del día
function normalizeDateRange(dateFrom: Date, dateTo: Date) {
  const from = new Date(dateFrom);
  from.setHours(0, 0, 0, 0);

  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export async function getAccountActivity(params: {
  accountId: string;
  dateFrom: Date;
  dateTo: Date;
  costCenter?: string;
}): Promise<{ success: boolean; data?: AccountActivityRow[]; error?: string }> {
  const { accountId, dateFrom, dateTo, costCenter } = params;

  try {
    // ---------------------------------------------------------------
    // 1. Normalizar fechas (ignorar horas)
    // ---------------------------------------------------------------
    const { from: dateFromStart, to: dateToEnd } = normalizeDateRange(
      dateFrom,
      dateTo
    );

    // ---------------------------------------------------------------
    // 2. Calcular saldo inicial (antes de dateFromStart)
    // ---------------------------------------------------------------
    const previousLines = await prisma.journalEntryLine.findMany({
      where: {
        accountId,
        journalEntry: {
          date: {
            lt: dateFromStart, // Todo lo anterior al día de inicio
          },
        },
        ...(costCenter ? { costCenterId: costCenter } : {}),
      },
    });

    const openingBalance = previousLines.reduce((acc, line) => {
      const debit = line.debit ? line.debit.toNumber() : 0;
      const credit = line.credit ? line.credit.toNumber() : 0;
      return acc + (debit - credit);
    }, 0);

    // ---------------------------------------------------------------
    // 3. Buscar líneas dentro del rango normalizado
    // ---------------------------------------------------------------
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        accountId,
        journalEntry: {
          date: {
            gte: dateFromStart,
            lte: dateToEnd,
          },
        },
        ...(costCenter ? { costCenterId: costCenter } : {}),
      },
      include: {
        journalEntry: true,
        costCenter: true,
      },
      orderBy: {
        journalEntry: {
          date: "asc",
        },
      },
    });

    let runningBalance = openingBalance;

    const rows: AccountActivityRow[] = [
      {
        id: "opening-balance",
        date: dateFromStart,
        description: "Saldo inicial",
        debit: 0,
        credit: 0,
        costCenter: null,
        balance: openingBalance,
      },
    ];

    for (const line of lines) {
      const debit = line.debit ? line.debit.toNumber() : 0;
      const credit = line.credit ? line.credit.toNumber() : 0;

      runningBalance += debit - credit;

      rows.push({
        id: line.id,
        date: line.journalEntry.date,
        description: line.journalEntry.description ?? "",
        debit,
        credit,
        costCenter: line.costCenter?.name ?? null,
        balance: runningBalance,
      });
    }

    return { success: true, data: rows };
  } catch (error) {
    console.error("Error fetching account activity:", error);
    return { success: false, error: "Error fetching account activity" };
  }
}
