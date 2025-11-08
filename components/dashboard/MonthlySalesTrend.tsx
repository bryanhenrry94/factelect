"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import DashboardCard from "../shared/DashboardCard";
import { getMonthNamesUpToCurrent } from "@/utils/dashboard";
import { useTheme } from "@mui/material/styles";
import { getMonthlySalesData } from "@/app/actions/dashboard";
import { useSession } from "next-auth/react";

// 👇 Importa el chart dinámicamente (solo en el cliente)
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const MonthlySalesTrend: React.FC = () => {
  const theme = useTheme();

  const { data: session } = useSession();

  const [monthlySalesData, setMonthlySalesData] = React.useState<number[]>([]);
  const categories = getMonthNamesUpToCurrent();

  useEffect(() => {
    const fetchMonthlySalesData = async () => {
      const year = new Date().getFullYear();

      const salesData = await getMonthlySalesData(
        year,
        session?.user.tenantId || ""
      );
      setMonthlySalesData(salesData);
    };

    fetchMonthlySalesData();
  }, []);

  // 🎨 Configuración del gráfico
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.primary.light;

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      foreColor: "#64748B",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      toolbar: { show: false },
    },
    colors: [primary, secondary],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 4,
      hover: {
        size: 6,
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
      name: "Ventas",
      data: monthlySalesData,
    },
  ];

  return (
    <DashboardCard title="Tendencia de ventas mensuales">
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={350}
      />
    </DashboardCard>
  );
};

export default MonthlySalesTrend;
