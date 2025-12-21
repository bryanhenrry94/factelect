"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpLeft, Currency } from "lucide-react";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMonthlyEarnings } from "@/actions/dashboard";

interface EarningsData {
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

const MonthlyEarnings = () => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user.tenantId) return;

      const data = await getMonthlyEarnings(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        session.user.tenantId
      );

      setEarningsData(data);
    };

    fetchData();
  }, [session?.user.tenantId]);

  const total = earningsData?.currentMonth.total || 0;
  const growth = earningsData?.growthPercentage || 0;
  const trend = earningsData?.trend || "up";

  const options: any = {
    chart: {
      type: "area",
      fontFamily: "inherit",
      toolbar: { show: false },
      height: 60,
      sparkline: { enabled: true },
      group: "sparklines",
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "solid",
      opacity: 0.08,
    },
    markers: { size: 0 },
    tooltip: {
      theme: "light",
    },
  };

  const series: any = [
    {
      name: "Ingresos",
      data: earningsData?.history?.map((h) => h.total) || [],
    },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Ingresos Mensuales
        </CardTitle>

        <Button size="icon" variant="secondary" className="rounded-full">
          <Currency className="h-5 w-5" />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between">
        <div>
          <div className="mt-1 text-3xl font-bold">
            ${total.toLocaleString("es-EC")}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                trend === "up"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-500"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpLeft className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </div>

            <span
              className={`text-sm font-semibold ${
                trend === "up" ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trend === "up" ? "+" : "-"}
              {growth.toFixed(1)}%
            </span>

            <span className="text-sm text-muted-foreground">
              vs. año anterior
            </span>
          </div>
        </div>

        <div className="mt-3">
          <Chart
            options={options}
            series={series}
            type="area"
            height={60}
            width="100%"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyEarnings;
