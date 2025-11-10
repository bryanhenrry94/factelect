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
import { Plus, Eye, Trash2, Files, Delete, Edit } from "lucide-react";
import { InvoiceResponse } from "@/lib/validations/invoice";
import { useSession } from "next-auth/react";
import { deleteInvoice, getInvoices } from "@/app/actions/invoice";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import InvoiceStatusLabel from "@/components/invoice/InvoiceStatusLabel";
import { useRouter } from "next/navigation";

export default function InvoicesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    loadData();
  }, [session?.user?.tenantId]);

  const loadData = async () => {
    const response = await getInvoices(session?.user?.tenantId || "");

    if (response.success && response.data) {
      setInvoices(response.data);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "¿Eliminar factura?",
      "Esta acción no se puede deshacer."
    );

    if (confirm) {
      const response = await deleteInvoice(id);

      if (response.success) {
        AlertService.showSuccess("Factura eliminada correctamente");
        loadData();
      } else {
        AlertService.showError(
          response.error || "Error al eliminar la factura"
        );
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/facturas/${id}`);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
  };

  const paginatedInvoices = invoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <PageContainer title="Facturas" description="Crea y gestiona tus facturas">
      <PageHeader title="Facturas" />

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField label="Buscar facturas" variant="outlined" size="small" />
        <Link href="/facturas/nueva" style={{ textDecoration: "none" }}>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Crear Factura
          </Button>
        </Link>
      </Box>

      <Box>
        <Card>
          <CardContent sx={{ p: 3 }}>
            {invoices.length === 0 ? (
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
                  No hay facturas aún
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Agrega tu primera factura
                </Typography>
              </Box>
            ) : (
              <Box>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell># Documento</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Fecha de Emisión</TableCell>
                      <TableCell>Fecha de Vencimiento</TableCell>
                      <TableCell>Importe</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell sx={{ fontWeight: "medium" }}>
                          <Typography
                            variant="body2"
                            component={Link}
                            href={`/facturas/${invoice.id}`}
                            sx={{
                              textDecoration: "none",
                              color: "primary.main",
                            }}
                          >
                            {invoice.document}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "normal" }}
                            >
                              {invoice.customer?.name || "N/A"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {invoice.customer?.identification || "N/A"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.issueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${invoice.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <InvoiceStatusLabel status={invoice.status} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(invoice.id || "")}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(invoice.id || "")}
                            disabled={invoice.status !== "DRAFT"}
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
                  count={Math.ceil(invoices.length / itemsPerPage)}
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
