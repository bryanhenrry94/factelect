"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";

import {
  deleteJournalEntry,
  getJournalEntries,
  JournalEntryFilter,
} from "@/actions/accounting/journal-entry";
import {
  JournalEntry,
  JournalEntryResponse,
} from "@/lib/validations/accounting/journal_entry";
import { formatCurrency, formatDate } from "@/utils/formatters";

/* ShadCN */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useTypeFilter } from "@/hooks/useTypeFilter";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAccountFilter } from "@/hooks/useAccountFilter";
import { ChartOfAccount } from "@/lib/validations";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { AccountSelect } from "@/components/AccountSelected";
import { Separator } from "@/components/ui/separator";

export default function AsientosContablesPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryResponse[]>(
    []
  );

  // Filters
  const { search, setSearch } = useSearchFilter();
  const { account, setAccount } = useAccountFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter();
  const { type, setType } = useTypeFilter();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ---------------- Fetch ---------------- */
  const fetchAccounts = async () => {
    if (!session?.user?.tenantId) return;

    try {
      const response = await getAccounts(session.user.tenantId);
      if (response.success) {
        setAccounts(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchJournalEntries = async () => {
    if (!session?.user?.tenantId) return;

    const filters: JournalEntryFilter = {
      tenantId: session.user.tenantId,
      search: search || undefined,
      accountId: account || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      type: type !== "none" ? (type as any) : undefined,
    };

    const response = await getJournalEntries(filters);

    if (!response.success) {
      notifyError("Error al cargar los asientos contables");
      return;
    }

    setJournalEntries(response.data || []);
  };

  useEffect(() => {
    fetchJournalEntries();
  }, [session?.user?.tenantId, search, account, dateFrom, dateTo, type]);

  useEffect(() => {
    fetchAccounts();
  }, [session?.user?.tenantId]);

  /* ---------------- Actions ---------------- */
  const handleCreate = () => {
    router.push("/contabilidad/asientos-contables/nuevo");
  };

  const handleEdit = (entry: JournalEntry) => {
    router.push(`/contabilidad/asientos-contables/${entry.id}/editar`);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await ConfirmDialog.confirm(
      "Aviso",
      "¿Deseas eliminar el asiento contable?"
    );
    if (!confirmed) return;

    const response = await deleteJournalEntry(id);

    if (response.success) {
      notifyInfo("Asiento contable eliminado correctamente");
      fetchJournalEntries();
    } else {
      notifyError("Error al eliminar el asiento contable");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <PageContainer
      title="Asientos Contables"
      description="Gestiona los asientos contables de tu organización"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Asientos Contables</CardTitle>
            <CardDescription>
              Administra los asientos contables de tu empresa.
            </CardDescription>
          </div>

          <Button variant="default" onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 mt-4">
            {/* Buscar */}
            <Field>
              <FieldLabel>Buscar</FieldLabel>
              <Input
                placeholder="Buscar por descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
            {/* Cuenta Contable */}
            <Field>
              <FieldLabel>Cuenta Contable</FieldLabel>
              <AccountSelect
                label="Seleccionar cuenta"
                accounts={accounts}
                value={account}
                onChange={(value) => setAccount(value)}
              />
            </Field>
            {/* Tipo */}
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de transacción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  <SelectItem value="PURCHASE">Compra</SelectItem>
                  <SelectItem value="SALE">Venta</SelectItem>
                  <SelectItem value="DEPOSIT">Depósito</SelectItem>
                  <SelectItem value="INVENTORY">Inventario</SelectItem>
                  <SelectItem value="WITHHOLDING">Retención</SelectItem>
                  <SelectItem value="ENTRY">Asiento</SelectItem>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                  <SelectItem value="EXPENSE">Gasto</SelectItem>
                  <SelectItem value="AUTOMATIC_CLOSING">
                    Cierre automático
                  </SelectItem>
                  <SelectItem value="PAYROLL">Nómina</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {/* Desde */}
            <Field>
              <FieldLabel>Desde</FieldLabel>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </Field>
            {/* Hasta */}
            <Field>
              <FieldLabel>Hasta</FieldLabel>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </Field>
          </div>

          <Separator className="my-4" />

          {journalEntries.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="mx-auto mb-2" />
              No se encontraron asientos contables.
            </div>
          ) : (
            <div className="space-y-4">
              {journalEntries
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  (currentPage - 1) * itemsPerPage + itemsPerPage
                )
                .map((entry) => (
                  <Card
                    key={entry.id}
                    className="border shadow-sm hover:shadow-md transition"
                  >
                    {/* HEADER */}
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(entry.date.toString())}
                          </p>
                          <h4 className="text-sm font-semibold">
                            {entry.description || "Asiento contable"}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Puedes mostrar origen si lo tienes */}
                          {entry.type && (
                            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                              {entry.type}
                            </span>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Delete className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* LINES */}
                      <div className="mt-4 overflow-x-auto">
                        {entry.lines && entry.lines.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Cuenta</TableHead>
                                <TableHead className="text-right">
                                  Debe
                                </TableHead>
                                <TableHead className="text-right">
                                  Haber
                                </TableHead>
                                <TableHead className="text-center">
                                  Centro de Costo
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entry.lines.map((line, idx) => (
                                <TableRow key={line.id || idx}>
                                  <TableCell className="font-medium">
                                    {line.account?.code && line.account?.name
                                      ? `${line.account.code} ${line.account.name}`
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {line.debit
                                      ? formatCurrency(line.debit)
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {line.credit
                                      ? formatCurrency(line.credit)
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {line.costCenter?.name
                                      ? `${line.costCenter.code} ${line.costCenter.name}`
                                      : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}

                              {/* Totales */}
                              <TableRow className="bg-muted/50 font-semibold">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    entry.lines.reduce(
                                      (sum, l) => sum + (l.debit || 0),
                                      0
                                    )
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(
                                    entry.lines.reduce(
                                      (sum, l) => sum + (l.credit || 0),
                                      0
                                    )
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">
                            Sin líneas de detalle
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* PAGINACIÓN */}
              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={journalEntries.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
