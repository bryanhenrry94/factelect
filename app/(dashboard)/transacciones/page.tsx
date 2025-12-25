"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Edit, Trash2, File } from "lucide-react";

import PageContainer from "@/components/container/PageContainer";
import {
  deleteTransaction,
  getPersonsByTenant,
  getTransactions,
} from "@/actions";
import { TransactionInput } from "@/lib/validations";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { getTransactionTypeLabel } from "@/utils/transaction";
import { getPaymentMethodLabel } from "@/utils/paymentMethods";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PersonInput } from "@/lib/validations/person/person";
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
import { usePersonFilter } from "@/hooks/usePersonFilter";
import { useTypeFilter } from "@/hooks/useTypeFilter";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { notifyError, notifyInfo } from "@/lib/notifications";

const TransactionsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter();
  const { person, setPerson } = usePersonFilter();
  const { type, setType } = useTypeFilter();

  const [transactions, setTransactions] = React.useState<TransactionInput[]>(
    []
  );
  const [persons, setPersons] = React.useState<PersonInput[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  const handleAdd = () => router.push("/transacciones/nueva");
  const handleEdit = (t: TransactionInput) => {
    router.push(`/transacciones/${t.id}/editar`);
  };
  const handleDelete = async (id: string) => {
    const confirmed = await ConfirmDialog.confirm(
      "¿Estás seguro",
      "¿Deseas eliminar esta transacción?"
    );

    if (confirmed) {
      const res = await deleteTransaction(id);

      if (!res.success) {
        notifyError(res.error || "No se pudo eliminar la transacción.");
        return;
      }

      if (res.success) {
        notifyInfo("Transacción eliminada correctamente.");
        fetchTransactions();
      }
    }
  };

  const normalizedSearch = React.useMemo(
    () => search?.trim() || undefined,
    [search]
  );

  const tenantId = session?.user?.tenantId;

  const fetchTransactions = React.useCallback(
    async (signal?: AbortSignal) => {
      if (!tenantId) return;

      try {
        setLoading(true);
        setError(null);

        const res = await getTransactions({
          tenantId,
          search: normalizedSearch,
          type: type === "none" ? undefined : (type as "INCOME" | "EXPENSE"),
          personId: person === "none" ? undefined : person,
          fromDate: dateFrom,
          toDate: dateTo,
        });

        if (!signal?.aborted) {
          setTransactions(res.success && res.data ? res.data : []);
        }
      } catch {
        if (!signal?.aborted) {
          setError("No se pudieron obtener las transacciones.");
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [tenantId, normalizedSearch, type, person, dateFrom, dateTo]
  );

  React.useEffect(() => {
    const controller = new AbortController();
    fetchTransactions(controller.signal);
    return () => controller.abort();
  }, [fetchTransactions]);

  const getPersons = async () => {
    try {
      if (!session?.user?.tenantId) return;
      const res = await getPersonsByTenant({ tenantId: session.user.tenantId });
      if (res.success && res.data) {
        setPersons(res.data);
      } else {
        setPersons([]);
      }
    } catch {
      setError("No se pudieron obtener las personas.");
    }
  };

  React.useEffect(() => {
    getPersons();
    fetchTransactions();
  }, [session?.user?.tenantId]);

  const getPersonName = (personId: string) => {
    const person = persons.find((p) => p.id === personId);
    return person
      ? `${person.firstName} ${person.lastName}` || person.businessName
      : "Desconocido";
  };

  return (
    <PageContainer
      title="Transacciones"
      description="Administra las transacciones de tu negocio"
    >
      {/* Header */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg">Filtros</CardTitle>
            {/* <CardDescription>
              Filtra y busca entre las transacciones registradas
            </CardDescription> */}
          </div>

          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Buscar */}
            <Field>
              <FieldLabel>Buscar</FieldLabel>
              <Input
                placeholder="Buscar transacciones"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                  <SelectItem value="INCOME">Cobro</SelectItem>
                  <SelectItem value="EXPENSE">Pago</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Persona */}
            <Field>
              <FieldLabel>Persona</FieldLabel>
              <Select value={person} onValueChange={setPerson}>
                <SelectTrigger>
                  <SelectValue placeholder="Persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos</SelectItem>
                  {persons.map((p) => (
                    <SelectItem key={p.id} value={p.id || ""}>
                      {p.firstName && p.lastName
                        ? `${p.firstName} ${p.lastName}`
                        : p.businessName}
                    </SelectItem>
                  ))}
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
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Lista de Transacciones</CardTitle>
          <CardDescription>
            Administra las transacciones registradas en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <File className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No hay transacciones registradas
              </h3>
              <p className="text-sm text-muted-foreground">
                Agrega tu primera transacción para comenzar
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      "Tipo",
                      "Método",
                      "Persona",
                      "Fecha",
                      "Referencia",
                      "Descripción",
                      "Monto",
                      "Acciones",
                    ].map((h) => (
                      <TableHead key={h}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {transactions
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{getTransactionTypeLabel(t.type)}</TableCell>
                        <TableCell>{getPaymentMethodLabel(t.method)}</TableCell>
                        <TableCell>
                          {persons && getPersonName(t.personId)}
                        </TableCell>
                        <TableCell>
                          {formatDate(t.issueDate.toString())}
                        </TableCell>
                        <TableCell>{t.reference || "-"}</TableCell>
                        <TableCell>{t.description || "-"}</TableCell>
                        <TableCell>{formatCurrency(t.amount)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(t)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(t.id || "")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={transactions.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </PageContainer>
  );
};

export default TransactionsPage;
