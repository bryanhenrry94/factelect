"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { notifyError, notifyWarning } from "@/lib/notifications";
import { getCostCenters } from "@/actions/accounting/cost-center";
import { getBalanceGeneral } from "@/actions/accounting/balance-general";

import { CostCenter } from "@/lib/validations/accounting/cost-center";
import { AccountBalance } from "@/actions/accounting/balance-general";
import { formatCurrency, formatDate } from "@/utils/formatters";

const today = new Date();
const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
const lastDayOfYear = new Date(today.getFullYear(), 11, 31);

export default function BalanceGeneralPage() {
  const { data: session } = useSession();

  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [rows, setRows] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const [costCenterId, setCostCenterId] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState(
    firstDayOfYear.toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState(
    lastDayOfYear.toISOString().split("T")[0]
  );

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
      const response = await getBalanceGeneral({
        costCenter: costCenterId,
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      });

      if (response.success && response.data) {
        setRows(response.data);
      } else {
        setRows([]);
        notifyError(response.error || "Error al cargar información.");
      }
    } catch {
      notifyError("Error al cargar información.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Estado de Situación Financiera">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select value={costCenterId} onValueChange={setCostCenterId}>
            <SelectTrigger>
              <SelectValue placeholder="Centro de costo (Todos)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Todos</SelectItem>
              {costCenters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <Button
            onClick={handleSearch}
            disabled={loading}
            className="md:mt-0 mt-2"
          >
            <Search className="mr-2 h-4 w-4" />
            {loading ? "Cargando..." : "Consultar"}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card className="mt-6">
        <CardContent>
          <div className="text-center mb-4">
            <h2 className="font-semibold">{session?.user?.tenantName}</h2>
            <p className="text-sm">Estado de Situación Financiera</p>
            <p className="text-xs text-muted-foreground">
              Del {formatDate(dateFrom)} al {formatDate(dateTo)}
            </p>
          </div>

          <Separator className="mb-4" />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuenta</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center italic text-muted-foreground"
                  >
                    No se encontraron datos.
                  </TableCell>
                </TableRow>
              )}

              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}

              {rows.map((row) => (
                <TableRow key={row.code}>
                  <TableCell className="font-medium">
                    {row.code} — {row.name}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(row.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
