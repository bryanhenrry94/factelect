"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Pagination,
  TextField,
} from "@mui/material";
import { Plus, Files, Delete, Edit } from "lucide-react";
import { useSession } from "next-auth/react";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { DocumentResponse } from "@/lib/validations";
import { deleteDocument, getDocuments } from "@/app/actions";
import { PageHeader } from "@/components/ui/PageHeader";

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
        AlertService.showSuccess("Documento eliminado correctamente");
        loadData();
      } else {
        AlertService.showError(
          response.error || "Error al eliminar el documento"
        );
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/documentos/${id}`);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const paginatedDocuments = documents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <PageContainer
      title="Documentos"
      description="Crea y gestiona tus documentos"
    >
      <PageHeader title="Documentos" />

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField label="Buscar documentos" variant="outlined" size="small" />
        <Link href="/documentos/nuevo" style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Crear Documento
          </Button>
        </Link>
      </Box>

      <Box>
        <Card>
          <CardContent sx={{ p: 3 }}>
            {documents.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 6,
                  textAlign: "center",
                }}
              >
                <Files />
                <Typography variant="h6" gutterBottom>
                  No hay documentos aún
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Agrega tu primer documento
                </Typography>
              </Box>
            ) : (
              <Box>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Persona</TableCell>
                      <TableCell>Fecha de Emisión</TableCell>
                      <TableCell>Fecha de Vencimiento</TableCell>
                      <TableCell>Total Venta</TableCell>
                      <TableCell>Pagos</TableCell>
                      <TableCell>Saldo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedDocuments.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "normal" }}
                            >
                              {document?.person?.fullname || "N/A"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {document.person?.identification || "N/A"}
                            </Typography>
                          </Box>
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
                        <TableCell>
                          {formatCurrency(document.balance)}
                        </TableCell>
                        <TableCell>{document.status}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(document.id || "")}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(document.id || "")}
                            disabled={document.status !== "DRAFT"}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  sx={{ p: 2 }}
                  count={Math.ceil(documents.length / itemsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
