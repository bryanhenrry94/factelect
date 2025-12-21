"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { getYearlyBreakup } from "@/actions/dashboard";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface YearlyData {
  totalCurrentYear: number;
  growthPercentage: number;
  distribution: { label: string; value: number }[];
}

const YearlyBreakup = () => {
  const { data: session } = useSession();
  const [data, setData] = useState<YearlyData | null>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // 🎨 Colores (Tailwind / CSS vars)
  const primary = "hsl(var(--primary))";
  const primaryLight = "hsl(var(--primary) / 0.15)";

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!session?.user.tenantId) return;

        const response = await getYearlyBreakup(
          currentYear,
          session.user.tenantId
        );
        setData(response);
      } catch (err) {
        console.error("Error fetching yearly breakup:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session?.user.tenantId]);

  // 📊 Configuración del gráfico
  const options: any = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
      foreColor: "#9ca3af",
      toolbar: { show: false },
    },
    colors: [primary, primaryLight, "#F3F4F6"],
    plotOptions: {
      pie: {
        donut: { size: "75%" },
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: { show: false },
  };

  const total = data?.totalCurrentYear ?? 0;
  const growth = data?.growthPercentage ?? 0;
  const isPositive = growth >= 0;
  const Icon = isPositive ? ArrowUpLeft : ArrowDownRight;
  const series = data?.distribution?.map((d) => d.value) || [];

  // 🕑 Loading
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desglose anual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">
            Cargando datos...
          </p>
        </CardContent>
      </Card>
    );
  }

  // 🚫 Sin datos
  if (!data || total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desglose anual</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">
            No hay datos disponibles para {currentYear}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose anual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
          {/* Izquierda */}
          <div className="sm:col-span-7">
            <h3 className="text-3xl font-bold">
              ${total.toLocaleString("es-EC")}
            </h3>

            <div className="mt-2 flex items-center gap-2">
              <Avatar
                className={`h-7 w-7 ${
                  isPositive ? "bg-emerald-100" : "bg-red-100"
                }`}
              >
                <AvatarFallback>
                  <Icon
                    className={`h-4 w-4 ${
                      isPositive ? "text-emerald-600" : "text-red-600"
                    }`}
                  />
                </AvatarFallback>
              </Avatar>

              <span className="text-sm font-semibold">
                {isPositive ? "+" : "-"}
                {Math.abs(growth).toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                vs. año anterior
              </span>
            </div>

            <div className="mt-6 flex gap-6">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: primary }}
                />
                <span className="text-sm text-muted-foreground">
                  {previousYear}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: primaryLight }}
                />
                <span className="text-sm text-muted-foreground">
                  {currentYear}
                </span>
              </div>
            </div>
          </div>

          {/* Derecha */}
          <div className="sm:col-span-5 flex items-center justify-center">
            <Chart
              options={options}
              series={series}
              type="donut"
              height={150}
              width="100%"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default YearlyBreakup;
