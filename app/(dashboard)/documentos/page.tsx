"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { DocumentResponse } from "@/lib/validations";
import { deleteDocument, getDocuments, getPersonsByTenant } from "@/actions";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { Plus, Files, Delete, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { PersonInput } from "@/lib/validations/person";

export default function DocumentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter();
  const { person, setPerson } = usePersonFilter();
  const { type, setType } = useTypeFilter();

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    loadData();
    getPersons();
  }, [session?.user?.tenantId]);

  const loadData = async () => {
    const response = await getDocuments(session?.user?.tenantId || "");

    if (response.success && response.data) {
      setDocuments(response.data);
    }
  };

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
      console.error("Error fetching persons");
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await ConfirmDialog.confirm(
      "Aviso",
      "¿Estás seguro de que deseas eliminar este documento?"
    );

    if (confirm) {
      const response = await deleteDocument(id);

      if (response.success) {
        notifyInfo("Documento eliminado correctamente");
        loadData();
      } else {
        notifyError(response.error || "Error al eliminar el documento");
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/documentos/${id}/editar`);
  };

  const paginatedDocuments = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAdd = () => {
    router.push("/documentos/nuevo");
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "INVOICE":
        return "FAC";
      case "CREDIT_NOTE":
        return "NC";
      case "DEBIT_NOTE":
        return "ND";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
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
                placeholder="Buscar por documento"
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

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <Files />
              <div className="text-lg font-semibold">No hay documentos aún</div>
              <div className="text-sm text-muted-foreground">
                Agrega tu primer documento
              </div>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead>Documento</TableHead>
                    {/* <TableHead>Vencimiento</TableHead> */}
                    <TableHead>Neto</TableHead>
                    <TableHead>Impuesto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pagos</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        {formatDate(document.issueDate.toString())}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-normal text-sm">
                            {document?.person?.fullname || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {document.person?.identification || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-normal text-sm">
                          {getDocumentTypeLabel(document.documentType)} -{" "}
                          {document.documentNumber}
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        {document.dueDate
                          ? formatDate(document.dueDate?.toString())
                          : "-"}
                      </TableCell> */}
                      <TableCell>{formatCurrency(document.subtotal)}</TableCell>
                      <TableCell>{formatCurrency(document.taxTotal)}</TableCell>
                      <TableCell>{formatCurrency(document.total)}</TableCell>
                      <TableCell>
                        {formatCurrency(document.paidAmount)}
                      </TableCell>
                      <TableCell>{formatCurrency(document.balance)}</TableCell>
                      <TableCell>{document.status}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <button
                          className="p-1 hover:bg-muted rounded"
                          onClick={() => handleEdit(document.id)}
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          className="p-1 hover:bg-destructive/20 rounded"
                          onClick={() => handleDelete(document.id)}
                        >
                          <Delete size={18} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={documents.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
