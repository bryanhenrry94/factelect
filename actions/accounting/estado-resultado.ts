"use server";

import { prisma } from "@/lib/prisma";

function normalizeDateRange(dateFrom: Date, dateTo: Date) {
  const from = new Date(dateFrom);
  from.setHours(0, 0, 0, 0);

  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

export type IncomeStatementAccount = {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";
  balance: number;
};

export async function getEstadoResultados(params: {
  costCenter?: string;
  dateFrom: Date;
  dateTo: Date;
}): Promise<{
  success: boolean;
  data?: IncomeStatementAccount[];
  error?: string;
}> {
  const { costCenter, dateFrom, dateTo } = params;

  try {
    const { from: dateFromStart, to: dateToEnd } = normalizeDateRange(
      dateFrom,
      dateTo
    );

    // 1️⃣ Obtener cuentas contables tipo INGRESOS (4) y GASTOS (5)
    const accounts = await prisma.account.findMany({
      where: {
        accountType: { in: ["INCOME", "EXPENSE"] },
      },
      orderBy: { code: "asc" },
    });

    if (!accounts.length) {
      return { success: true, data: [] };
    }

    const results: IncomeStatementAccount[] = [];

    let totalIngresos = 0;
    let totalGastos = 0;

    for (const acc of accounts) {
      // 2️⃣ Obtener movimientos dentro del período (NO se usa saldo inicial en estado de resultados)
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

      const balance = periodLines.reduce((total, line) => {
        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);

        // INCOME: credit (+)
        // EXPENSE: debit (-)
        return total + (debit - credit);
      }, 0);

      const signedBalance = acc.accountType === "INCOME" ? -balance : balance;

      if (acc.accountType === "INCOME") totalIngresos += signedBalance;
      if (acc.accountType === "EXPENSE") totalGastos += signedBalance;

      results.push({
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.accountType,
        balance: signedBalance,
      });
    }

    // 3️⃣ Calcular utilidad del período
    const utilidad = totalIngresos - totalGastos;

    results.push({
      id: "RESULT",
      code: "",
      name: utilidad >= 0 ? "UTILIDAD DEL PERÍODO" : "PÉRDIDA DEL PERÍODO",
      type: "INCOME",
      balance: utilidad,
    });

    return { success: true, data: results };
  } catch (error) {
    console.error("Error generating estado de resultados:", error);
    return { success: false, error: "Error generating estado de resultados" };
  }
}
