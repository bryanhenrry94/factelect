"use client";
import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import {
  getTenantSriConfig,
  updateTenantSriConfig,
} from "@/actions/tenant-sri-config";

import {
  CreateTenantSriConfig,
  TenantSriConfigInput,
} from "@/lib/validations/sri-config";
import { AlertService } from "@/lib/alerts";
import { sriEnvironmentOptions } from "@/constants/sri";
import UploadCertificateForm from "../ui/UploadCertificateForm";

import {
  Box,
  Button,
  MenuItem,
  TextField,
  Typography,
  Grid,
  Stack,
} from "@mui/material";
import { notifyError, notifyInfo } from "@/lib/notifications";

interface SriTenantFormProps {
  tenantId: string;
}

const SRIConfigForm: React.FC<SriTenantFormProps> = ({ tenantId }) => {
  const { data: session } = useSession();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<CreateTenantSriConfig>();

  const certificatePath = watch("certificatePath");

  const onSubmit = async (data: TenantSriConfigInput) => {
    const currentTenantId = session?.user?.tenantId;
    if (!currentTenantId) {
      notifyError("No se encontró el tenantId en la sesión.");
      return;
    }

    if (data.environment === "PRODUCTION") {
      const confirm = await AlertService.showConfirm(
        "¿Cambiar al ambiente de PRODUCCIÓN?",
        "El ambiente de producción envía comprobantes electrónicos con validez fiscal ante el SRI. ¿Desea continuar?"
      );
      if (!confirm) return;
    }

    const result = await updateTenantSriConfig(currentTenantId, data);
    if (result?.success) {
      notifyInfo("Configuración SRI actualizada correctamente.");
      reset(result.data);
    } else {
      notifyError(result?.error || "Error al actualizar configuración.");
    }
  };

  const fetchTenantSRIConfig = useCallback(async () => {
    const currentTenantId = session?.user?.tenantId;
    if (!currentTenantId) return;

    const result = await getTenantSriConfig(currentTenantId);
    if (result?.success) {
      reset(result.data);
    }
  }, [session?.user?.tenantId, reset]);

  useEffect(() => {
    fetchTenantSRIConfig();
  }, [fetchTenantSRIConfig]);

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
            <strong>Ambiente de Pruebas:</strong> Para realizar pruebas sin
            afectar documentos reales. Los comprobantes no tienen validez
            fiscal.
            <br />
            <strong>Ambiente de Producción:</strong> Para emisión real de
            comprobantes electrónicos con validez fiscal ante el SRI.
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
                {...register("environment")}
                value={watch("environment") || ""}
                error={!!errors.environment}
                helperText={errors.environment?.message}
              >
                {sriEnvironmentOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              {certificatePath && (
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
            certificatePath={certificatePath || null}
            onSave={fetchTenantSRIConfig}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SRIConfigForm;
