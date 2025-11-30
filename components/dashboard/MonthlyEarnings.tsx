"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Avatar, Fab } from "@mui/material";
import DashboardCard from "@/components/shared/DashboardCard";
import { ArrowDown, ArrowUpLeft, Currency } from "lucide-react";
import { useEffect, useState } from "react";
import { getMonthlyEarnings } from "@/actions/dashboard";
import { useSession } from "next-auth/react";

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

  const theme = useTheme();
  const secondary = theme.palette.secondary.main;
  const secondarylight = "#f5fcff";
  const successlight = "#E6FFFA";
  const errorlight = "#fdede8";

  useEffect(() => {
    const fetchData = async () => {
      const data = await getMonthlyEarnings(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        session?.user.tenantId || ""
      );
      setEarningsData(data);
    };
    fetchData();
  }, []);

  const optionscolumnchart: any = {
    chart: {
      type: "area",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: "#adb0bb",
      toolbar: { show: false },
      height: 60,
      sparkline: { enabled: true },
      group: "sparklines",
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      colors: [secondarylight],
      type: "solid",
      opacity: 0.05,
    },
    markers: { size: 0 },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
    },
  };

  const seriescolumnchart: any = [
    {
      name: "Ingresos",
      color: secondary,
      data: earningsData?.history?.map((h) => h.total) || [],
    },
  ];

  const total = earningsData?.currentMonth.total || 0;
  const growth = earningsData?.growthPercentage || 0;
  const trend = earningsData?.trend || "up";

  return (
    <DashboardCard
      title="Ingresos Mensuales"
      action={
        <Fab color="secondary" size="medium" sx={{ color: "#ffffff" }}>
          <Currency width={24} />
        </Fab>
      }
      footer={
        <Chart
          options={optionscolumnchart}
          series={seriescolumnchart}
          type="area"
          height={60}
          width={"100%"}
        />
      }
    >
      <>
        <Typography variant="h3" fontWeight="700" mt="-20px">
          ${total.toLocaleString("es-EC")}
        </Typography>

        <Stack direction="row" spacing={1} my={1} alignItems="center">
          <Avatar
            sx={{
              bgcolor: trend === "up" ? successlight : errorlight,
              width: 27,
              height: 27,
            }}
          >
            {trend === "up" ? (
              <ArrowUpLeft width={20} color="#39B69A" />
            ) : (
              <ArrowDown width={20} color="#FA896B" />
            )}
          </Avatar>

          <Typography
            variant="subtitle2"
            fontWeight="600"
            color={trend === "up" ? "#39B69A" : "#FA896B"}
          >
            {trend === "up" ? "+" : "-"}
            {growth.toFixed(1)}%
          </Typography>

          <Typography variant="subtitle2" color="textSecondary">
            vs. año anterior
          </Typography>
        </Stack>
      </>
    </DashboardCard>
  );
};

export default MonthlyEarnings;
