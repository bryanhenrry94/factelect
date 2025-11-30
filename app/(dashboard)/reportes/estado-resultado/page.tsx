"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Box,
  Button,
  Card,
  Divider,
  Grid,
  MenuItem,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { notifyError, notifyWarning } from "@/lib/notifications";
import { getCostCenters } from "@/actions/accounting/cost-center";
import { getBalanceGeneral } from "@/actions/accounting/balance-general";

import { CostCenter } from "@/lib/validations/accounting/cost-center";
import { AccountBalance } from "@/actions/accounting/balance-general";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  getEstadoResultados,
  IncomeStatementAccount,
} from "@/actions/accounting/estado-resultado";

const today = new Date();
const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
const lastDayOfYear = new Date(today.getFullYear(), 11, 31);

export default function EstadoResultadoPage() {
  const { data: session } = useSession();

  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [rows, setRows] = useState<IncomeStatementAccount[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [costCenterId, setCostCenterId] = useState("");
  const [dateFrom, setDateFrom] = useState(
    firstDayOfYear.toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(
    lastDayOfYear.toISOString().split("T")[0]
  );

  // ==========================
  // Load dropdown data
  // ==========================
  useEffect(() => {
    async function loadData() {
      if (!session?.user?.tenantId) return;

      const ccRes = await getCostCenters(session.user.tenantId);
      if (ccRes.success) setCostCenters(ccRes.data || []);
    }

    loadData();
  }, [session?.user?.tenantId]);

  const handleSearch = async () => {
    if (!dateFrom || !dateTo) {
      notifyWarning("Por favor seleccione el rango de fechas.");
      return;
    }

    setLoading(true);

    try {
      const response = await getEstadoResultados({
        costCenter: costCenterId || undefined,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      });

      if (response.success && response.data) {
        setRows(response.data);
      } else {
        setRows([]);
        notifyError(response.error || "Error al cargar información.");
      }
    } catch (error) {
      notifyError("Error al cargar información.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Estado de Resultado">
      <PageHeader title="Estado de Resultado" />

      {/* ========================== */}
      {/* Card filtros */}
      {/* ========================== */}
      <Card sx={{ mt: 4, p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Filtros de búsqueda
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              label="Centro de Costo"
              fullWidth
              size="small"
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {costCenters.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
            <TextField
              label="Desde"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
            <TextField
              label="Hasta"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={loading}
              sx={{
                mt: 1,
                px: 4,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              {loading ? "Cargando..." : "Consultar"}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* ========================== */}
      {/* Tabla de resultados */}
      {/* ========================== */}

      <Card sx={{ mt: 4, p: 3, borderRadius: 3 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h6">{session?.user?.tenantName}</Typography>
          <Typography variant="subtitle1">Estado de Resultado</Typography>
          <Typography variant="subtitle2">
            Del {formatDate(dateFrom)} al {formatDate(dateTo)}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <TableContainer
          sx={{
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 700 }}>Cuenta</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Total
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                    <Typography color="grey.600" fontStyle="italic">
                      No se encontraron datos.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton width={180} />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton width={60} />
                    </TableCell>
                  </TableRow>
                ))}

              {rows.map((row) => (
                <TableRow
                  key={row.code}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "grey.50" },
                  }}
                >
                  <TableCell>
                    <Typography fontWeight={500}>
                      {row.code} — {row.name}
                    </Typography>
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(row.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </PageContainer>
  );
}
