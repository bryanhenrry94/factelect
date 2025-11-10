"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Button,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Container,
  CircularProgress,
} from "@mui/material";
import { ArrowLeft, Edit } from "lucide-react";
import { InvoiceResponse } from "@/lib/validations/invoice";
import { useSession } from "next-auth/react";
import { getInvoice, getInvoiceItems } from "@/app/actions/invoice";
import { AlertService } from "@/lib/alerts";
import { InvoiceItemResponse } from "@/lib/validations/invoice-item";
import InvoiceTotals from "@/components/invoice/totals";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";

const InvoiceViewPage = () => {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceItemResponse[]>([]);

  useEffect(() => {
    if (!session?.user?.tenantId || !params.id) return;

    loadInvoice();
  }, [session?.user?.tenantId, params.id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await getInvoice(params.id as string);

      if (response.success && response.data) {
        setInvoice(response.data);

        // Load items
        if (response.data.id) loadItems(response.data.id);
      } else {
        AlertService.showError("Error al cargar la factura");
      }
    } catch (error) {
      AlertService.showError("Error al cargar la factura");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (invoiceId: string) => {
    try {
      const response = await getInvoiceItems(invoiceId);

      if (response.success && response.data) {
        setItems(response.data);
      } else {
        AlertService.showError("Error al cargar los items de la factura");
      }
    } catch (error) {
      AlertService.showError("Error al cargar los items de la factura");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" gutterBottom>
            Factura no encontrada
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => router.push("/facturas")}
          >
            Volver a Facturas
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <PageContainer
      title={`Factura ${invoice.document}`}
      description="Detalles de la factura"
    >
      <PageHeader
        title={"Ver Factura"}
        routes={[{ name: "Facturas", href: "/facturas" }]}
      />

      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            alignItems: { sm: "center" },
            justifyContent: "flex-end",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Edit size={16} />}
              onClick={() => router.push(`/facturas/${invoice.id}/edit`)}
            >
              Editar
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Invoice Details */}
        <Grid container spacing={3}>
          {/* Basic Info */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Información de la Factura
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Número de Documento
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                    {invoice.document}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip
                    label={invoice.status}
                    color="primary"
                    size="small"
                    sx={{ textTransform: "capitalize", mt: 0.5 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Emisión
                  </Typography>
                  <Typography variant="body1">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Vencimiento
                  </Typography>
                  <Typography variant="body1">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Client Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Cliente
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {invoice.customer?.name || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice.customer?.identification || "N/A"}
              </Typography>
              {invoice.customer?.email && (
                <Typography variant="body2" color="text.secondary">
                  {invoice.customer.email}
                </Typography>
              )}
              {invoice.customer?.phone && (
                <Typography variant="body2" color="text.secondary">
                  {invoice.customer.phone}
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Items */}
          <Grid size={{ xs: 12 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Productos
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="right">Descuento</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product.description}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          ${item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          {item.discountAmount ? item.discountAmount : 0}
                        </TableCell>
                        <TableCell align="right">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Descripcion
                  </Typography>
                  <Typography variant="body1">
                    {invoice.description || "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 200 }}>
                  <InvoiceTotals items={items} />
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </PageContainer>
  );
};

export default InvoiceViewPage;
