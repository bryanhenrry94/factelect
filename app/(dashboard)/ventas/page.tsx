"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { DocumentResponse } from "@/lib/validations";
import { deleteDocument, getDocuments, getPersonsByTenant } from "@/actions";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { Plus, Files, Delete, Edit, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { PersonInput } from "@/lib/validations/person/person";
import { useDocumentFilter } from "@/hooks/useDocumentFilter";
import { getDocumentTypeLabel } from "@/utils/document";
import { $Enums } from "@/prisma/generated/prisma";
import Link from "next/link";

export default function SalesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [persons, setPersons] = useState<PersonInput[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filters
  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter();
  const { person, setPerson } = usePersonFilter();

  const loadData = async () => {
    const params = {
      tenantId: session?.user?.tenantId || "",
      search: search || undefined,
      personId: person !== "none" ? person : undefined,
      entityType: $Enums.EntityType.CUSTOMER,
      documentType: $Enums.DocumentType.INVOICE,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };

    const response = await getDocuments(params);

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
        notifyInfo("Factura eliminada correctamente");
        loadData();
      } else {
        notifyError(response.error || "Error al eliminar la factura");
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/ventas/${id}/editar`);
  };

  const handleAdd = () => {
    router.push("/ventas/nuevo");
  };

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    getPersons();
  }, [session?.user?.tenantId]);

  useEffect(() => {
    if (status !== "authenticated") return;

    loadData();
  }, [status, session?.user?.tenantId, search, dateFrom, dateTo, person]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Facturas de Venta</CardTitle>
            <CardDescription>
              Lista de facturas de venta creadas en el sistema.
            </CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
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
                    <TableHead>Neto</TableHead>
                    <TableHead>Impuesto</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Pagos</TableHead>
                    <TableHead>Retención</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead className="text-center">Autorizado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((document) => (
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
                          <Link
                            href={`/documentos/${document.id}/editar`}
                            className="underline hover:text-primary"
                          >
                            <div className="font-normal text-sm">
                              {getDocumentTypeLabel(document.documentType)} -{" "}
                              {document.number}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(document.subtotal)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(document.taxTotal)}
                        </TableCell>
                        <TableCell>{formatCurrency(document.total)}</TableCell>
                        <TableCell>
                          {formatCurrency(document.paidAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(document.totalWithheld)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(document.balance)}
                        </TableCell>
                        <TableCell className="text-center">
                          {document.documentFiscalInfo?.sriStatus ===
                            "AUTHORIZED" && <Check size={16} />}
                        </TableCell>
                        <TableCell className="flex flex-row">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(document.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(document.id)}
                          >
                            <Delete className="h-4 w-4 text-destructive" />
                          </Button>
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
