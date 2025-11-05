"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import {
  Container,
  Box,
  Typography,
  Stack,
  Button,
  Tooltip,
  Alert,
  Grid,
  Paper,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
} from "@mui/material";
import {
  Save,
  Send,
  UserPlus,
  Package,
  CreditCard,
  PlusCircle,
  Delete,
} from "lucide-react";
import CustomRow from "@/components/invoice/custom-row";
import { taxOptions } from "@/constants/tax";
import { AlertService } from "@/lib/alerts";
import type { CreateInvoice } from "@/lib/validations/invoice";
import { InvoiceItem } from "@/lib/validations/invoice-item";
import { getClientsByTenant } from "@/app/actions/client";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "@/app/actions/product";
import {
  getEmissionPointsByEstablishment,
  getNextSequenceDocumentNumber,
} from "@/app/actions/emission-point";
import { createInvoice } from "@/app/actions/invoice";
import { getEstablishmentsByTenant } from "@/app/actions/establishment";
import { generateAccessKey } from "@/utils/sri";
import { SRIConfiguration } from "@/prisma/generated/prisma";
import { getTenantSriConfig } from "@/app/actions/tenant-sri-config";
import { Tenant } from "@/lib/validations/tenant";
import { getTenantById } from "@/app/actions/tenant";
import { InvoiceTotals } from "@/components/invoice/totals";
import { sriPaymentMethods } from "@/constants/sri";
import { InvoicePaymentMethod } from "@/lib/validations/invoice-payment-method";
import ClientFormDialog from "@/components/client/client-form-dialog";
import { useRouter } from "next/navigation";
import { ProductFormDialog } from "@/components/product/product-form-dialog";
import { CreateProduct } from "@/lib/validations/product";

interface InvoiceFormInputs {
  establishmentId: string;
  emissionPointId: string;
  numDocumento: string;
  issueDate: string;
  dueDate: string;
  clientId: string;
  description: string;
}

function TabPanel({
  children,
  value,
  index,
}: {
  children?: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function InvoicesNewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { control, handleSubmit, watch, setValue, reset } =
    useForm<InvoiceFormInputs>({
      defaultValues: {
        establishmentId: "",
        emissionPointId: "",
        numDocumento: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date().toISOString().split("T")[0],
        clientId: "",
        description: "",
      },
    });

  const [clients, setClients] = useState<any[]>([]);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [emissionPoints, setEmissionPoints] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [sriConfig, setSriConfig] = useState<SRIConfiguration | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<InvoicePaymentMethod[]>(
    []
  );

  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openClientDialog, setOpenClientDialog] = useState(false);

  const handleOpenClientDialog = () => {
    setOpenClientDialog(true);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) =>
    setTabValue(newValue);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.tenantId) return;
      const [clientRes, productRes, establishmentRes, tenantRes, sriConfigRes] =
        await Promise.all([
          getClientsByTenant(session.user.tenantId),
          getAllProducts(session.user.tenantId),
          getEstablishmentsByTenant(session.user.tenantId),
          getTenantById(session.user.tenantId),
          getTenantSriConfig(session.user.tenantId),
        ]);
      if (clientRes.success) setClients(clientRes.data);
      if (productRes.success) setProducts(productRes.data || []);
      if (establishmentRes.success)
        setEstablishments(establishmentRes.data || []);
      if (sriConfigRes.success) setSriConfig(sriConfigRes.data || null);
      if (tenantRes.success) setTenant(tenantRes.data || null);
    };
    fetchData();
  }, [session?.user?.tenantId]);

  const loadClients = async () => {
    if (!session?.user?.tenantId) return;
    const response = await getClientsByTenant(session.user.tenantId);
    if (response.success) setClients(response.data);
  };

  // Cambio de establecimiento → cargar puntos de emisión
  const handleChangeEstablishment = async (value: string) => {
    setValue("establishmentId", value);
    const response = await getEmissionPointsByEstablishment(value);
    if (response.success) setEmissionPoints(response.data || []);
  };

  const handleChangeEmissionPoint = async (value: string) => {
    setValue("emissionPointId", value);
    const result = await getNextSequenceDocumentNumber(value, "INVOICE");
    if (result.success && result.nextSequence !== undefined) {
      const nextNum = result.nextSequence.toString().padStart(8, "0");
      setValue("numDocumento", nextNum);
    }
  };

  const onSubmit = async (data: InvoiceFormInputs) => {
    try {
      setError(null);

      if (!tenant || !sriConfig) {
        setError("Configuración del SRI o de empresa no encontrada.");
        return;
      }

      if (!tenant?.ruc) {
        setError("RUC de la empresa no encontrado.");
        return;
      }

      setIsSubmitting(true);
      if (items.length === 0) {
        setError("Debe agregar al menos un producto o servicio a la factura.");
        return;
      }

      if (paymentMethods.length === 0) {
        setError("Debe agregar al menos una forma de pago a la factura.");
        return;
      }

      // valida si la suma de las formas de pago es igual al total de la factura
      const itemsSubtotal = items
        .map((item) => item.subtotal + (item.taxAmount || 0))
        .reduce((acc, curr) => acc + curr, 0);

      const totalPaymentMethods = paymentMethods
        .map((method) => method.amount || 0)
        .reduce((acc, curr) => acc + curr, 0);

      if (itemsSubtotal !== totalPaymentMethods) {
        setError(
          `La suma de las formas de pago (${totalPaymentMethods.toFixed(
            2
          )}) no coincide con el total de la factura (${itemsSubtotal.toFixed(
            2
          )}).`
        );
        return;
      }

      const total = items
        .map((item) => item.subtotal + (item.taxAmount || 0))
        .reduce((acc, curr) => acc + curr, 0);

      // Generar clave de acceso, revisar utils/sri.ts
      const accessKey = generateAccessKey(
        new Date(data.issueDate),
        "01", // Tipo de documento: Factura
        tenant?.ruc, // RUC - TODO: Obtener del establecimiento o configuración SRI
        sriConfig?.sriEnvironment || "1", // Ambiente: 1=Pruebas, 2=Producción
        "001001", // Serie: TODO: Obtener del punto de emisión
        data.numDocumento,
        "12345678", // Código numérico: TODO: Generar aleatoriamente
        "1" // Tipo de emisión: 1=Normal
      );

      const newInvoice: CreateInvoice = {
        clientId: data.clientId,
        tenantId: session?.user?.tenantId || "",
        emissionPointId: data.emissionPointId,
        sequential: parseInt(data.numDocumento, 10),
        accessKey: accessKey,
        authorization: "",
        status: "PENDING",
        issueDate: new Date(data.issueDate),
        term: 0,
        dueDate: new Date(data.dueDate),
        total,
        description: data.description,
        xmlFilePath: "",
        pdfFilePath: "",
        sriResponse: null,
      };

      const response = await createInvoice(newInvoice, items, paymentMethods);
      if (response.success) {
        AlertService.showSuccess("Factura creada exitosamente.");
        reset();
        setItems([]);
        setPaymentMethods([]);
        router.push(`/facturas/${response.data?.id}/edit`);
      } else {
        setError(response.error || "Error al crear la factura");
      }
    } catch (err) {
      setError("Error al enviar la factura");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const handleDeletePaymentMethod = (index: number) => {
    const updatedPaymentMethods = paymentMethods.filter((_, i) => i !== index);
    setPaymentMethods(updatedPaymentMethods);
  };

  const handleAddPaymentMethod = () => {
    const newPaymentMethod: InvoicePaymentMethod = {
      id: undefined,
      invoiceId: "",
      paymentMethod: "20",
      term: 0,
      timeUnit: "DAYS",
      amount: 0,
    };
    setPaymentMethods((prev) => [...prev, newPaymentMethod]);
  };

  const handleSubmitProduct = async (data: CreateProduct) => {
    try {
      console.log("Submitting product data:", data);

      await createProduct(data, session?.user?.tenantId || "");
      await loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setOpenProductDialog(false);
    }
  };

  const loadProducts = async () => {
    const response = await getAllProducts(session?.user?.tenantId || "");
    if (response.success) setProducts(response.data || []);
  };

  const handleOpenProductDialog = () => {
    setOpenProductDialog(true);
  };

  return (
    <Container maxWidth="xl">
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Nueva Factura
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Crear una nueva factura para un cliente
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save size={18} />}
              disabled={isSubmitting}
            >
              Guardar
            </Button>
            <Tooltip title="Enviar al SRI">
              <Button
                variant="outlined"
                startIcon={<Send size={18} />}
                disabled={items.length === 0}
              >
                Enviar
              </Button>
            </Tooltip>
          </Stack>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {/* Información del Documento */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography fontWeight={600}>Información del Documento</Typography>
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: 400,
            }}
          >
            <Controller
              name="issueDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha de Emisión"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              )}
            />
            <Stack spacing={2} direction={"row"}>
              <Controller
                name="establishmentId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Establecimiento"
                    select
                    size="small"
                    fullWidth
                    onChange={(e) => handleChangeEstablishment(e.target.value)}
                    required
                  >
                    {establishments.map((est) => (
                      <MenuItem key={est.id} value={est.id}>
                        {est.code}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="emissionPointId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Punto de Emisión"
                    select
                    size="small"
                    fullWidth
                    onChange={(e) => handleChangeEmissionPoint(e.target.value)}
                    required
                  >
                    {emissionPoints.map((point) => (
                      <MenuItem key={point.id} value={point.id}>
                        {point.code}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>

            <Controller
              name="numDocumento"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Número de Documento"
                  size="small"
                  fullWidth
                  inputProps={{ readOnly: true }}
                  required
                />
              )}
            />
            <Stack spacing={2} direction={"row"} alignItems="center">
              <Controller
                name="clientId"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Autocomplete
                    options={clients}
                    getOptionLabel={(option) =>
                      `[${option.identification}] - ${option.name}` || ""
                    }
                    value={
                      clients.find((client) => client.id === value) || null
                    }
                    fullWidth
                    onChange={(_, newValue) => onChange(newValue?.id || "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cliente"
                        size="small"
                        fullWidth
                        required
                      />
                    )}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                  />
                )}
              />
              <IconButton color="primary" onClick={handleOpenClientDialog}>
                <UserPlus size={20} />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
        {/* Tabs */}
        <Paper sx={{ p: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              icon={<Package size={18} />}
              iconPosition="start"
              label="Productos / Servicios"
            />
            <Tab
              icon={<CreditCard size={18} />}
              iconPosition="start"
              label="Formas de Pago"
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto / Servicio</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Precio Unitario</TableCell>
                    <TableCell>IVA</TableCell>
                    <TableCell>% Desc.</TableCell>
                    <TableCell>Subtotal</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay productos agregados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <CustomRow
                        key={index}
                        item={item}
                        index={index}
                        products={products}
                        taxOptions={taxOptions}
                        setItems={setItems}
                        getProductById={getProductById}
                        onDelete={handleDeleteItem}
                        onOpenModal={handleOpenProductDialog}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction="row" justifyContent="flex-end" mt={2}>
              <Button
                variant="text"
                startIcon={<PlusCircle size={16} />}
                onClick={() =>
                  setItems([
                    ...items,
                    {
                      id: "",
                      invoiceId: "",
                      productId: "",
                      quantity: 1,
                      unitPrice: 0,
                      tax: "IVA_12",
                      taxAmount: 0,
                      discountRate: 0,
                      discountAmount: 0,
                      subtotal: 0,
                    },
                  ])
                }
              >
                Agregar Producto
              </Button>
            </Stack>
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {/* Payment Methods Content */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Forma de Pago</TableCell>
                    <TableCell>Plazo</TableCell>
                    <TableCell>Unid. de tiempo</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentMethods.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay formas de pago agregadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paymentMethods.map((method, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={method.paymentMethod || ""}
                            sx={{ width: 400 }}
                            onChange={(e) => {
                              const updatedMethods = [...paymentMethods];
                              updatedMethods[index].paymentMethod =
                                e.target.value;
                              setPaymentMethods(updatedMethods);
                            }}
                            required
                          >
                            {sriPaymentMethods.map((method) => (
                              <MenuItem key={method.value} value={method.value}>
                                {method.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={method.term || 0}
                            sx={{ width: 150 }}
                            onChange={(e) => {
                              const updatedMethods = [...paymentMethods];
                              updatedMethods[index].term = Number(
                                e.target.value
                              );
                              setPaymentMethods(updatedMethods);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={method.timeUnit || ""}
                            sx={{ width: 150 }}
                            onChange={(e) => {
                              const updatedMethods = [...paymentMethods];
                              updatedMethods[index].timeUnit = e.target.value;
                              setPaymentMethods(updatedMethods);
                            }}
                          >
                            <MenuItem value="DAYS">Días</MenuItem>
                            <MenuItem value="MONTHS">Meses</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={method.amount || 0}
                            sx={{ width: 150 }}
                            onChange={(e) => {
                              const updatedMethods = [...paymentMethods];
                              updatedMethods[index].amount = Number(
                                e.target.value
                              );
                              setPaymentMethods(updatedMethods);
                            }}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="error"
                            onClick={() => handleDeletePaymentMethod(index)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack direction="row" justifyContent="flex-end" mt={2}>
              <Button
                variant="text"
                startIcon={<PlusCircle size={16} />}
                onClick={handleAddPaymentMethod}
              >
                Agregar Forma de Pago
              </Button>
            </Stack>
          </TabPanel>
        </Paper>

        {/* Total */}
        <Paper sx={{ p: 2, mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción"
                    multiline
                    rows={2}
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <InvoiceTotals items={items} />
            </Grid>
          </Grid>
        </Paper>
      </Box>
      {/* DIALOGO FORMULARIO */}
      <ClientFormDialog
        open={openClientDialog}
        onClose={() => setOpenClientDialog(false)}
        onSuccess={loadClients}
        editingClient={null}
        tenantId={session?.user?.tenantId ?? ""}
        setError={setError}
      />

      {/* Modal */}
      <ProductFormDialog
        isDialogOpen={openProductDialog}
        handleCloseDialog={() => setOpenProductDialog(false)}
        editingProduct={null}
        onSubmit={handleSubmitProduct}
      />
    </Container>
  );
}
