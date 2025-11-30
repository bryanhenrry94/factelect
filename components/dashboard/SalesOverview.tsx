"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Select, MenuItem, CircularProgress, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import DashboardCard from "@/components/shared/DashboardCard";
import { getCategoriesForMonth, getLastMonths } from "@/utils/dashboard";
import { getTotalAmountByMonth } from "@/actions/dashboard";
import { useSession } from "next-auth/react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SalesOverview: React.FC = () => {
  const theme = useTheme();

  const { data: session } = useSession();

  const [month, setMonth] = useState<number | null>(null);
  const [months, setMonths] = useState<{ value: number; label: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [weeklySales, setWeeklySales] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 🎯 Cargar datos del mes seleccionado
  const fetchMonthlyData = useCallback(async (selectedMonth: number) => {
    setLoading(true);
    const currentYear = new Date().getFullYear();

    // Semanas del mes
    const data = getCategoriesForMonth(currentYear, selectedMonth);
    setCategories(data || []);

    // Totales de ventas por semana
    const weeklySalesData = await getTotalAmountByMonth(
      currentYear,
      selectedMonth,
      session?.user.tenantId || ""
    );
    setWeeklySales(weeklySalesData || []);
    setLoading(false);
  }, []);

  // 🧭 Carga inicial (últimos meses)
  useEffect(() => {
    const monthsData = getLastMonths();
    setMonths(monthsData);

    if (monthsData.length > 0) {
      const currentMonth = monthsData[0].value;
      setMonth(currentMonth);
      fetchMonthlyData(currentMonth);
    }
  }, [fetchMonthlyData]);

  const handleChange = (event: any) => {
    const selectedMonth = event.target.value as number;
    setMonth(selectedMonth);
    fetchMonthlyData(selectedMonth);
  };

  // 🎨 Configuración del gráfico
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.primary.light;

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      foreColor: "#64748B",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    colors: [primary, secondary],
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 6,
        distributed: false,
      },
    },
    grid: {
      borderColor: "rgba(0,0,0,0.08)",
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      tickAmount: 4,
      labels: {
        formatter: (val) => `$${val.toLocaleString()}`,
      },
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => `$${val.toLocaleString()}`,
      },
    },
  };

  const series = [
    {
      name: "Ingresos del mes",
      data: weeklySales,
    },
  ];

  return (
    <DashboardCard
      title="Resumen de ventas"
      action={
        <Select
          value={month || ""}
          size="small"
          onChange={handleChange}
          sx={{
            minWidth: 120,
            background: theme.palette.background.paper,
            borderRadius: 2,
          }}
        >
          {months.map((m) => (
            <MenuItem key={m.value} value={m.value}>
              {m.label}
            </MenuItem>
          ))}
        </Select>
      }
    >
      {loading ? (
        <Box
          height={370}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Chart options={options} series={series} type="bar" height={370} />
      )}
    </DashboardCard>
  );
};

export default SalesOverview;
