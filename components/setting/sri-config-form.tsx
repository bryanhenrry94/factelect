"use client";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import {
  getTenantSriConfig,
  updateCertificatePassword,
  updateTenantSriConfig,
} from "@/app/actions/tenant-sri-config";
import {
  deleteEstablishment,
  getEstablishments,
} from "@/app/actions/establishment";
import {
  deleteEmissionPoint,
  getEmissionPoints,
} from "@/app/actions/emission-point";
import {
  CreateTenantSriConfig,
  TenantSriConfig,
  TenantSriConfigInput,
} from "@/lib/validations/tenant-sri-config";
import { AlertService } from "@/lib/alerts";
import { sriEnvironmentOptions } from "@/constants/sri";
import { Establishment } from "@/lib/validations/establishment";
import {
  EmissionPoint,
  EmissionPointWithEstablishmentSchema,
} from "@/lib/validations/emission-point";
import EstablishmentDialog from "../establishment/establishment-dialog";
import EmissionPointDialog from "../emission-point/emission-point-dialog";
import UploadCertificateForm from "../ui/UploadCertificateForm";

import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Stack,
  IconButton,
  TableFooter,
} from "@mui/material";
import { Edit, Delete, PlusCircle } from "lucide-react";

interface SriTenantFormProps {
  tenantId: string;
}

const SriTenantForm: React.FC<SriTenantFormProps> = ({ tenantId }) => {
  const { data: session } = useSession();

  const [tenantSriConfig, setTenantSriConfig] =
    useState<TenantSriConfig | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [emissionPoints, setEmissionPoints] = useState<
    EmissionPointWithEstablishmentSchema[]
  >([]);

  // Modales
  const [openEstablishmentDialog, setOpenEstablishmentDialog] = useState(false);
  const [editingEstablishment, setEditingEstablishment] =
    useState<Establishment | null>(null);

  const [openEmissionPointDialog, setOpenEmissionPointDialog] = useState(false);
  const [editingEmissionPoint, setEditingEmissionPoint] =
    useState<EmissionPoint | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<CreateTenantSriConfig>();

  const p12CertificatePath = watch("p12CertificatePath");

  /** ==========================
   * FETCH FUNCTIONS
   =========================== */
  const fetchTenantSRIConfig = useCallback(async () => {
    if (!tenantId) return;

    const result = await getTenantSriConfig(tenantId);
    if (result.success && result.data) {
      setTenantSriConfig(result.data);
      reset(result.data);
    } else {
      AlertService.showError("No se pudo obtener la configuración SRI.");
    }
  }, [tenantId, reset]);

  const fetchEstablishments = useCallback(async () => {
    if (!tenantSriConfig?.id) return;
    const result = await getEstablishments(tenantSriConfig.id);
    if (result.success) setEstablishments(result.data || []);
  }, [tenantSriConfig?.id]);

  const fetchEmissionPoints = useCallback(async () => {
    if (!tenantSriConfig?.id) return;
    const result = await getEmissionPoints(tenantSriConfig.id);
    if (result.success) setEmissionPoints(result.data || []);
  }, [tenantSriConfig?.id]);

  /** ==========================
   * EFFECTS
   =========================== */
  useEffect(() => {
    fetchTenantSRIConfig();
  }, [fetchTenantSRIConfig]);

  useEffect(() => {
    if (tenantSriConfig?.id) {
      fetchEstablishments();
      fetchEmissionPoints();
    }
  }, [tenantSriConfig?.id, fetchEstablishments, fetchEmissionPoints]);

  /** ==========================
   * HANDLERS
   =========================== */
  const onSubmit = async (data: TenantSriConfigInput) => {
    const currentTenantId = session?.user?.tenantId;
    if (!currentTenantId) {
      AlertService.showError("No se encontró el tenantId en la sesión.");
      return;
    }

    const result = await updateTenantSriConfig(currentTenantId, data);
    if (result?.success) {
      AlertService.showSuccess("Configuración SRI actualizada correctamente.");
      reset(result.data);
    } else {
      AlertService.showError(
        result?.error || "Error al actualizar configuración."
      );
    }
  };

  const handleUpdateCertificatePassword = async () => {
    if (!tenantSriConfig?.id) return;
    const password = watch("certificatePassword");
    const result = await updateCertificatePassword(
      tenantSriConfig.id,
      password || ""
    );
    if (result.success)
      AlertService.showSuccess("Contraseña del certificado actualizada.");
    else AlertService.showError("No se pudo actualizar la contraseña.");
  };

  const handleDeleteEstablishment = async (id: string) => {
    if (!id) return;
    const confirm = await AlertService.showConfirm(
      "¿Eliminar este establecimiento?",
      "Esta acción eliminará todos los datos asociados. ¿Desea continuar?"
    );
    if (!confirm) return;

    const result = await deleteEstablishment(id);
    result.success
      ? (AlertService.showSuccess("Eliminado correctamente."),
        fetchEstablishments())
      : AlertService.showError("Error al eliminar el establecimiento.");
  };

  const handleDeleteEmissionPoint = async (id: string) => {
    if (!id) return;
    const confirm = await AlertService.showConfirm(
      "¿Eliminar este punto de emisión?",
      "Esta acción no se puede deshacer."
    );
    if (!confirm) return;

    const result = await deleteEmissionPoint(id);
    result.success
      ? (AlertService.showSuccess("Punto de emisión eliminado."),
        fetchEmissionPoints())
      : AlertService.showError("Error al eliminar el punto de emisión.");
  };

  /** ==========================
   * RENDER
   =========================== */
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Configuración de Facturación Electrónica SRI
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Configure los parámetros necesarios para emitir facturas electrónicas a
        través del SRI.
      </Typography>

      {/* Ambiente SRI */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="body1">Ambiente SRI</Typography>
          <Typography variant="caption" color="text.secondary">
            Seleccione el entorno de pruebas o producción según corresponda.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
            >
              <TextField
                select
                fullWidth
                label="Ambiente"
                {...register("sriEnvironment")}
                value={watch("sriEnvironment") || ""}
                error={!!errors.sriEnvironment}
                helperText={errors.sriEnvironment?.message}
              >
                {sriEnvironmentOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              {p12CertificatePath && (
                <TextField
                  fullWidth
                  type="password"
                  label="Contraseña del Certificado"
                  {...register("certificatePassword")}
                  placeholder="Ingrese la contraseña"
                  error={!!errors.certificatePassword}
                  helperText={errors.certificatePassword?.message}
                />
              )}

              <Stack direction="row" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting || !isDirty}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Certificado Digital */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="body1">Certificado Digital (.p12)</Typography>
          <Typography variant="caption" color="text.secondary">
            Suba su certificado digital emitido por el SRI.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <UploadCertificateForm
            tenantId={tenantId}
            p12CertificatePath={p12CertificatePath || null}
            onSave={fetchTenantSRIConfig}
          />
        </Grid>
      </Grid>

      {/* Establecimientos */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="body1">Establecimientos</Typography>
          <Typography variant="caption" color="text.secondary">
            Configure los establecimientos registrados en el SRI.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {establishments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No hay establecimientos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  establishments.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.address}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setEditingEstablishment(item);
                            setOpenEstablishmentDialog(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            handleDeleteEstablishment(item.id ?? "")
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Button
                      variant="text"
                      startIcon={<PlusCircle />}
                      onClick={() => {
                        setEditingEstablishment(null);
                        setOpenEstablishmentDialog(true);
                      }}
                    >
                      Nuevo Establecimiento
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Puntos de Emisión */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="body1">Puntos de Emisión</Typography>
          <Typography variant="caption" color="text.secondary">
            Configure los puntos de emisión asociados a sus establecimientos.
          </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Establecimiento</TableCell>
                  <TableCell>Punto</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Secuencia</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emissionPoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay puntos de emisión registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  emissionPoints.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.establishment?.code}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.currentInvoiceSequence}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.isActive ? "Activo" : "Inactivo"}
                          color={item.isActive ? "primary" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => {
                            setEditingEmissionPoint(item);
                            setOpenEmissionPointDialog(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() =>
                            handleDeleteEmissionPoint(item.id ?? "")
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={6} align="right">
                    <Button
                      variant="text"
                      startIcon={<PlusCircle />}
                      onClick={() => {
                        setEditingEmissionPoint(null);
                        setOpenEmissionPointDialog(true);
                      }}
                    >
                      Nuevo Punto de Emisión
                    </Button>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <EstablishmentDialog
        open={openEstablishmentDialog}
        onClose={() => setOpenEstablishmentDialog(false)}
        onSuccess={fetchEstablishments}
        editingEstablishment={editingEstablishment}
        sriConfigId={tenantSriConfig?.id || ""}
      />

      <EmissionPointDialog
        open={openEmissionPointDialog}
        onClose={() => setOpenEmissionPointDialog(false)}
        onSuccess={fetchEmissionPoints}
        editingData={editingEmissionPoint}
        establishments={establishments}
        sriConfigId={tenantSriConfig?.id || ""}
      />
    </Box>
  );
};

export default SriTenantForm;
