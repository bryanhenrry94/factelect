"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { DocumentResponse } from "@/lib/validations";
import { deleteDocument, getDocuments } from "@/actions";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { Plus, Files, Delete, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

export default function DocumentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    loadData();
  }, [session?.user?.tenantId]);

  const loadData = async () => {
    const response = await getDocuments(session?.user?.tenantId || "");

    if (response.success && response.data) {
      setDocuments(response.data);
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

  const handlePageChange = (event: React.FormEvent<HTMLElement>) => {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    setCurrentPage(value);
  };

  const paginatedDocuments = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-4">
        <Input placeholder="Buscar documentos" className="max-w-xs" />
        <Link href="/documentos/nuevo">
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Nuevo
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
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
                    <TableHead>Persona</TableHead>
                    <TableHead>Fecha de Emisión</TableHead>
                    <TableHead>Fecha de Vencimiento</TableHead>
                    <TableHead>Total Venta</TableHead>
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
                        {formatDate(document.issueDate.toString())}
                      </TableCell>
                      <TableCell>
                        {document.dueDate
                          ? formatDate(document.dueDate?.toString())
                          : "-"}
                      </TableCell>
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
