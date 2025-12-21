"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMonthNamesUpToCurrent } from "@/utils/dashboard";
import { getMonthlySalesData } from "@/actions/dashboard";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const MonthlySalesTrend: React.FC = () => {
  const { data: session } = useSession();
  const [monthlySalesData, setMonthlySalesData] = useState<number[]>([]);
  const categories = getMonthNamesUpToCurrent();

  useEffect(() => {
    const fetchMonthlySalesData = async () => {
      if (!session?.user.tenantId) return;
      const year = new Date().getFullYear();

      const salesData = await getMonthlySalesData(year, session.user.tenantId);
      setMonthlySalesData(salesData);
    };

    fetchMonthlySalesData();
  }, [session?.user.tenantId]);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      foreColor: "#64748B", // slate-500
      fontFamily: "inherit",
      toolbar: { show: false },
    },
    colors: ["#3b82f6", "#93c5fd"], // blue-500, blue-300
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
      categories,
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
      theme: "light",
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Tendencia de ventas mensuales
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ReactApexChart
          options={options}
          series={series}
          type="line"
          height={350}
        />
      </CardContent>
    </Card>
  );
};

export default MonthlySalesTrend;
