"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Account } from "@/lib/validations";
import {
  Button,
  Card,
  Grid,
  MenuItem,
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
import { getAccounts } from "@/actions/accounting/account";
import { CostCenter } from "@/lib/validations/accounting/cost-center";
import { getCostCenters } from "@/actions/accounting/cost-center";
import { Search } from "lucide-react";
import {
  AccountActivityRow,
  getAccountActivity,
} from "@/actions/accounting/account-activity";
import { notifyError, notifyWarning } from "@/lib/notifications";
import { formatCurrency, formatDate } from "@/utils/formatters";

export default function MovimientosCuentaPage() {
  const { data: session } = useSession();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [rows, setRows] = useState<AccountActivityRow[]>([]);
  const [loading, setLoading] = useState(false);

  // ==========================
  // Filtros de búsqueda
  // ==========================
  const [accountId, setAccountId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ==========================
  // Data Fetch
  // ==========================
  useEffect(() => {
    async function loadData() {
      if (!session?.user.tenantId) return;

      try {
        const [accRes, ccRes] = await Promise.all([
          getAccounts(session.user.tenantId),
          getCostCenters(session.user.tenantId),
        ]);

        if (accRes.success) setAccounts(accRes.data || []);
        if (ccRes.success) setCostCenters(ccRes.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }

    loadData();
  }, [session?.user.tenantId]);

  const handleSearch = async () => {
    setLoading(true);

    try {
      if (!accountId || !dateFrom || !dateTo) {
        notifyWarning("Por favor, complete los filtros obligatorios.");
        setLoading(false);
        return;
      }

      // Lógica para buscar movimientos de cuenta según los filtros
      const response = await getAccountActivity({
        accountId,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        costCenter: costCenterId || undefined,
      });

      console.log("Account activity response:", response);

      if (response.success) {
        setRows(response.data || []);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error("Error fetching account activity:", error);
      setRows([]);
      notifyError("Error al cargar los movimientos de cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Movimientos de Cuenta">
      <PageHeader title="Movimientos de Cuenta" />

      <Card sx={{ mt: 4, p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Filtros de Búsqueda
        </Typography>

        <Grid container spacing={2}>
          {/* Cuenta */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Cuenta"
              fullWidth
              select
              size="small"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.code} — {account.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Centro de costo */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Centro de Costo"
              fullWidth
              select
              size="small"
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {costCenters.map((center) => (
                <MenuItem key={center.id} value={center.id}>
                  {center.code} — {center.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Fecha desde */}
          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
            <TextField
              label="Fecha Desde"
              type="date"
              fullWidth
              size="small"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Fecha hasta */}
          <Grid size={{ xs: 12, sm: 3, md: 2 }}>
            <TextField
              label="Fecha Hasta"
              type="date"
              fullWidth
              size="small"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Botón */}
          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Search />}
              sx={{
                mt: 1,
                px: 4,
                py: 1.4,
                borderRadius: 2,
                fontSize: "0.95rem",
                fontWeight: 600,
              }}
              onClick={handleSearch}
              disabled={loading}
              loading={loading}
            >
              Consultar
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ mt: 4, p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Movimientos
        </Typography>

        <TableContainer
          sx={{
            mt: 2,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            bgcolor: "background.paper",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "grey.100",
                  "& th": {
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: "0.85rem",
                    color: "grey.700",
                  },
                }}
              >
                <TableCell>Fecha</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="center">Debe</TableCell>
                <TableCell align="center">Haber</TableCell>
                <TableCell align="center">Centro de costo</TableCell>
                <TableCell align="center">Saldo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 3, fontStyle: "italic", color: "grey.600" }}
                  >
                    No se encontraron movimientos.
                  </TableCell>
                </TableRow>
              )}

              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    "& td": { py: 1 },
                  }}
                >
                  {/* Cuenta */}
                  <TableCell sx={{ width: 160 }}>
                    {formatDate(row.date.toString())}
                  </TableCell>
                  {/* Descripción */}
                  <TableCell sx={{ width: 260 }}>{row.description}</TableCell>
                  {/* Débito */}
                  <TableCell align="right" sx={{ width: 140 }}>
                    {formatCurrency(row.debit)}
                  </TableCell>
                  {/* Crédito */}
                  <TableCell align="right" sx={{ width: 140 }}>
                    {formatCurrency(row.credit)}
                  </TableCell>
                  {/* Centro de costo */}
                  <TableCell sx={{ width: 220 }}>{row.costCenter}</TableCell>
                  {/* Saldo */}
                  <TableCell align="center" sx={{ width: 60 }}>
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
