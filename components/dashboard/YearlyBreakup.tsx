"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import {
  Grid,
  Stack,
  Typography,
  Avatar,
  CircularProgress,
} from "@mui/material";
import DashboardCard from "@/components/shared/DashboardCard";
import { ArrowDownRight, ArrowUpLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { getYearlyBreakup } from "@/app/actions/dashboard";
import { useSession } from "next-auth/react";

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

  // 🎨 Paleta de colores desde el tema
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primaryLight = "#ecf2ff";
  const successLight = theme.palette.success.light;
  const errorLight = theme.palette.error.light;

  // 🚀 Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getYearlyBreakup(
          currentYear,
          session?.user.tenantId || ""
        );
        setData(response);
      } catch (err) {
        console.error("Error fetching yearly breakup:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 📊 Configuración del gráfico
  const options: any = {
    chart: {
      type: "donut",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: "#adb0bb",
      toolbar: { show: false },
    },
    colors: [primary, primaryLight, "#F9F9FD"],
    plotOptions: {
      pie: {
        donut: { size: "75%" },
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      fillSeriesColor: false,
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    legend: { show: false },
    responsive: [{ breakpoint: 991, options: { chart: { width: 120 } } }],
  };

  // 📈 Preparar datos visuales
  const total = data?.totalCurrentYear ?? 0;
  const growth = data?.growthPercentage ?? 0;
  const isPositive = growth >= 0;
  const iconColor = isPositive ? "#39B69A" : "#E57373";
  const bgColor = isPositive ? successLight : errorLight;
  const Icon = isPositive ? ArrowUpLeft : ArrowDownRight;
  const series = data?.distribution?.map((d) => d.value) || [];

  // 🕑 Estado de carga
  if (loading) {
    return (
      <DashboardCard title="Desglose anual">
        <Stack alignItems="center" py={4}>
          <CircularProgress color="primary" size={32} />
          <Typography variant="body2" mt={1}>
            Cargando datos...
          </Typography>
        </Stack>
      </DashboardCard>
    );
  }

  // 🚫 Si no hay datos
  if (!data || total === 0) {
    return (
      <DashboardCard title="Desglose anual">
        <Stack alignItems="center" py={4}>
          <Typography variant="body2" color="text.secondary">
            No hay datos disponibles para {currentYear}.
          </Typography>
        </Stack>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Desglose anual">
      <Grid container spacing={3}>
        {/* Columna izquierda */}
        <Grid size={{ xs: 12, sm: 7 }}>
          <Typography variant="h3" fontWeight="700">
            ${total.toLocaleString("es-EC")}
          </Typography>

          <Stack direction="row" spacing={1} mt={1} alignItems="center">
            <Avatar sx={{ bgcolor: bgColor, width: 27, height: 27 }}>
              <Icon width={20} color={iconColor} />
            </Avatar>
            <Typography variant="subtitle2" fontWeight="600">
              {isPositive ? "+" : "-"}
              {Math.abs(growth).toFixed(1)}%
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              vs. año anterior
            </Typography>
          </Stack>

          <Stack spacing={3} mt={5} direction="row">
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 9, height: 9, bgcolor: primary }} />
              <Typography variant="subtitle2" color="text.secondary">
                {previousYear}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 9, height: 9, bgcolor: primaryLight }} />
              <Typography variant="subtitle2" color="text.secondary">
                {currentYear}
              </Typography>
            </Stack>
          </Stack>
        </Grid>

        {/* Columna derecha */}
        <Grid size={{ xs: 12, sm: 5 }}>
          <Chart
            options={options}
            series={series}
            type="donut"
            height={150}
            width="100%"
          />
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default YearlyBreakup;
