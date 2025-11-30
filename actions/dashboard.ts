"use server";
import { prisma } from "@/lib/prisma";

interface MonthlyEarningsResponse {
  currentMonth: {
    month: string;
    total: number;
  };
  previousYear: {
    month: string;
    total: number;
  };
  growthPercentage: number;
  trend: "up" | "down";
  history: { month: string; total: number }[];
}

interface YearlyBreakupResponse {
  totalCurrentYear: number;
  totalLastYear: number;
  growthPercentage: number;
  distribution: { label: string; value: number }[];
}

export const getTotalAmountByMonth = async (
  year: number,
  month: number,
  tenantId: string
): Promise<number[]> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    // Get all invoices for the month
    const invoices = await prisma.document.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["CONFIRMED"], // Only count valid invoices
        },
      },
      select: {
        issueDate: true,
        total: true,
      },
    });

    // Helper function to get week number of month (0-based)
    const getWeekOfMonth = (date: Date): number => {
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayOfMonth = date.getDate();

      // Adjust for week starting on Monday (0 = Monday)
      const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
      const adjustedCurrentDay = dayOfMonth + adjustedFirstDay - 1;

      return Math.floor(adjustedCurrentDay / 7);
    };

    // Create array for weekly totals (up to 6 weeks possible in a month)
    const weeklyTotals = [0, 0, 0, 0, 0, 0];

    // Group invoices by week
    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.issueDate);
      const weekIndex = getWeekOfMonth(invoiceDate);

      if (weekIndex < weeklyTotals.length) {
        weeklyTotals[weekIndex] += Number(invoice.total);
      }
    });

    // Remove trailing zeros and ensure we have at least 4 weeks
    const nonZeroWeeks = weeklyTotals.findIndex(
      (total, index) =>
        index > 3 &&
        total === 0 &&
        weeklyTotals.slice(index).every((t) => t === 0)
    );

    const result =
      nonZeroWeeks > 0
        ? weeklyTotals.slice(0, nonZeroWeeks)
        : weeklyTotals.slice(0, 5);

    return result.length < 4
      ? [...result, ...new Array(4 - result.length).fill(0)]
      : result;
  } catch (error) {
    console.error("Error fetching total amount by month:", error);
    return [0, 0, 0, 0];
  }
};

export const getYearlyBreakup = async (
  year: number,
  tenantId: string
): Promise<YearlyBreakupResponse> => {
  try {
    const currentYearInvoices = await prisma.document.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
        status: {
          in: ["CONFIRMED"],
        },
      },
      select: {
        issueDate: true,
        total: true,
      },
    });

    const lastYearInvoices = await prisma.document.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year - 1, 0, 1),
          lte: new Date(year - 1, 11, 31),
        },
        status: {
          in: ["CONFIRMED"],
        },
      },
      select: {
        total: true,
      },
    });

    const monthlyTotals: { month: number; total: number }[] = Array.from(
      { length: 12 },
      (_, i) => ({ month: i + 1, total: 0 })
    );

    currentYearInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.issueDate);
      const monthIndex = invoiceDate.getMonth(); // 0-based index

      monthlyTotals[monthIndex].total += Number(invoice.total);
    });

    const totalCurrentYear = currentYearInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );
    const totalLastYear = lastYearInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const growthPercentage =
      totalLastYear > 0
        ? ((totalCurrentYear - totalLastYear) / totalLastYear) * 100
        : 0;

    const distribution = monthlyTotals.map((month, index) => ({
      label: new Date(0, index).toLocaleString("en", { month: "short" }),
      value: month.total,
    }));

    return {
      totalCurrentYear,
      totalLastYear,
      growthPercentage,
      distribution,
    };
  } catch (error) {
    return {
      totalCurrentYear: 0,
      totalLastYear: 0,
      growthPercentage: 0,
      distribution: [],
    };
  }
};

export const getMonthlyEarnings = async (
  year: number,
  month: number,
  tenantId: string
): Promise<MonthlyEarningsResponse> => {
  try {
    const currentMonthInvoices = await prisma.document.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
        status: {
          in: ["CONFIRMED"],
        },
      },
      select: {
        total: true,
      },
    });

    const previousYearInvoices = await prisma.document.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year - 1, month - 1, 1),
          lte: new Date(year - 1, month, 0),
        },
        status: {
          in: ["CONFIRMED"],
        },
      },
      select: {
        total: true,
      },
    });

    const currentMonthTotal = currentMonthInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const previousYearTotal = previousYearInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const growthPercentage =
      previousYearTotal > 0
        ? ((currentMonthTotal - previousYearTotal) / previousYearTotal) * 100
        : 0;

    const trend = growthPercentage >= 0 ? "up" : "down";

    // Generate history for the last 7 months including current month
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(year, month - 1 - i, 1);
      const monthInvoices = await prisma.document.findMany({
        where: {
          tenantId,
          issueDate: {
            gte: new Date(date.getFullYear(), date.getMonth(), 1),
            lte: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          },
          status: {
            in: ["CONFIRMED"],
          },
        },
        select: {
          total: true,
        },
      });

      const monthTotal = monthInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.total),
        0
      );

      history.push({
        month: date.toLocaleString("en", { month: "short" }),
        total: monthTotal,
      });
    }

    return {
      currentMonth: {
        month: new Date(year, month - 1).toLocaleString("en", {
          month: "long",
        }),
        total: currentMonthTotal,
      },
      previousYear: {
        month: new Date(year - 1, month - 1).toLocaleString("en", {
          month: "long",
        }),
        total: previousYearTotal,
      },
      growthPercentage: parseFloat(growthPercentage.toFixed(1)),
      trend,
      history,
    };
  } catch (error) {
    console.error("Error fetching monthly earnings:", error);
    return {
      currentMonth: { month: "", total: 0 },
      previousYear: { month: "", total: 0 },
      growthPercentage: 0,
      trend: "up",
      history: [],
    };
  }
};

export const getMonthlySalesData = async (
  year: number,
  tenantId: string
): Promise<number[]> => {
  try {
    const monthlyTotals: number[] = Array.from({ length: 12 }, () => 0);

    const invoices = await prisma.document.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
        status: {
          in: ["CONFIRMED"],
        },
      },
      select: {
        issueDate: true,
        total: true,
      },
    });

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.issueDate);
      const monthIndex = invoiceDate.getMonth(); // 0-based index

      monthlyTotals[monthIndex] += Number(invoice.total);
    });

    return monthlyTotals;
  } catch (error) {
    console.error("Error fetching monthly sales data:", error);
    return Array.from({ length: 12 }, () => 0);
  }
};
