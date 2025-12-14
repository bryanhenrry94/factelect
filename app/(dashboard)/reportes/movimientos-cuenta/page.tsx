"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { ChartOfAccount } from "@/lib/validations";
import { CostCenter } from "@/lib/validations/accounting/cost-center";
import { useSession } from "next-auth/react";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { getCostCenters } from "@/actions/accounting/cost-center";
import {
  AccountActivityRow,
  getAccountActivity,
} from "@/actions/accounting/account-activity";
import { notifyError, notifyWarning } from "@/lib/notifications";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Search } from "lucide-react";

/* ShadCN */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MovimientosCuentaPage() {
  const { data: session } = useSession();

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [rows, setRows] = useState<AccountActivityRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* Fechas por defecto */
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .substring(0, 10);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .substring(0, 10);

  const [accountId, setAccountId] = useState<string | undefined>();
  const [costCenterId, setCostCenterId] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth);
  const [dateTo, setDateTo] = useState(lastDayOfMonth);

  /* ==========================
     Load accounts & cost centers
     ========================== */
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
        console.error(error);
      }
    }

    loadData();
  }, [session?.user.tenantId]);

  /* ==========================
     Search
     ========================== */
  const handleSearch = async () => {
    if (!accountId || !dateFrom || !dateTo) {
      notifyWarning("Por favor, complete los filtros obligatorios.");
      return;
    }

    setLoading(true);

    try {
      const response = await getAccountActivity({
        accountId,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
        costCenter: costCenterId,
      });

      if (response.success) {
        setRows(response.data || []);
      } else {
        setRows([]);
      }
    } catch (error) {
      notifyError("Error al cargar los movimientos de cuenta");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Movimientos de Cuenta">
      {/* ================= Filtros ================= */}
      <Card className="mt-4">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Filtros de Búsqueda</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            {/* Cuenta */}
            <div className="md:col-span-2">
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} — {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Centro de costo */}
            <div className="md:col-span-2">
              <Select
                value={costCenterId}
                onValueChange={(v) =>
                  setCostCenterId(v === "ALL" ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los centros de costo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.code} — {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha desde */}
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            {/* Fecha hasta */}
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            {/* Botón */}
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="gap-2"
              >
                <Search size={16} />
                {loading ? "Consultando..." : "Consultar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================= Tabla ================= */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Movimientos</h2>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead>Centro de costo</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center italic">
                      No se encontraron movimientos.
                    </TableCell>
                  </TableRow>
                )}

                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.date.toString())}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.debit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.credit)}
                    </TableCell>
                    <TableCell>{row.costCenter}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
