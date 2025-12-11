"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertService } from "@/lib/alerts";
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
import { Pagination } from "@/components/ui/pagination";

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
    const confirm = await AlertService.showConfirm(
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
                          <div className="font-normal text-base">
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
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(document.id || "")}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(document.id || "")}
                          disabled={document.status !== "DRAFT"}
                        >
                          <Delete size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <span>
                    Página {currentPage} de{" "}
                    {Math.max(1, Math.ceil(documents.length / itemsPerPage))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage ===
                        Math.ceil(documents.length / itemsPerPage) ||
                      documents.length === 0
                    }
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
