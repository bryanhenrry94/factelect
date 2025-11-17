"use client";

import { Box, Button, TextField, Typography, Grid } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Tenant, tenantSchema } from "@/lib/validations/tenant";
import { updateTenant } from "@/app/actions/tenant";
import { AlertService } from "@/lib/alerts";
import UploadLogoForm from "../ui/UploadLogoForm";
import { EstablishmentForm } from "../establishment/EstablishmentForm";
import { EmissionPointForm } from "../emission-point/EmissionPointForm";

interface CompanyFormProps {
  initialData: Tenant | null;
}

export default function CompanyForm({ initialData }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<Tenant>({
    resolver: zodResolver(tenantSchema),
    defaultValues: initialData || {
      name: "",
      subdomain: "",
      legalName: "",
      ruc: "",
      phone: "",
      contactEmail: "",
      address: "",
      logoUrl: "",
    },
  });

  const onSubmit = async (data: Tenant) => {
    try {
      const result = await updateTenant(data.id || "", data);
      if (result.success) {
        AlertService.showSuccess(
          "Información de la empresa actualizada correctamente"
        );
      } else {
        AlertService.showError(
          "Error al actualizar la información de la empresa"
        );
      }
    } catch (error) {
      console.error(error);
      AlertService.showError("Ocurrió un error inesperado");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Información de la Empresa
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Actualiza los detalles de tu empresa que aparecerán en facturas y
        documentos oficiales.
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          mt: 4,
        }}
      >
        <Grid container spacing={3}>
          {/* RUC */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" gutterBottom>
              RUC (ID Fiscal)
            </Typography>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Registro Único de Contribuyentes de tu empresa.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="RUC"
              placeholder="1790012345001"
              inputProps={{ maxLength: 13 }}
              disabled
              {...register("ruc")}
              error={!!errors.ruc}
              helperText={errors.ruc?.message}
            />
          </Grid>
          {/* Nombre legal */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" gutterBottom>
              Nombre / Razón Social
            </Typography>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              El nombre oficial de tu empresa según registros legales.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre / Razón Social"
              placeholder="Ej: Mi Empresa S.A."
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>

          {/* Nombre comercial */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" gutterBottom>
              Nombre Comercial
            </Typography>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              El nombre con el que tus clientes conocen tu empresa.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre Comercial"
              placeholder="Ej: Comercial Andina"
              {...register("legalName")}
              error={!!errors.legalName}
              helperText={errors.legalName?.message}
            />
          </Grid>

          {/* Contacto */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" gutterBottom>
              Información de Contacto
            </Typography>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Proporciona los detalles de contacto de tu empresa.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Teléfono"
                placeholder="0991234567"
                {...register("phone")}
                error={!!errors.phone}
                helperText={errors.phone?.message}
              />
              <TextField
                fullWidth
                type="email"
                label="Correo"
                placeholder="info@empresa.com"
                {...register("contactEmail")}
                error={!!errors.contactEmail}
                helperText={errors.contactEmail?.message}
              />
              <TextField
                fullWidth
                label="Dirección"
                placeholder="Av. Principal 123 y Calle Secundaria"
                {...register("address")}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            </Box>
          </Grid>

          {/* Logo */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" gutterBottom>
              Logo de la Empresa
            </Typography>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              URL del logo que aparecerá en facturas y documentos oficiales.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Logo (URL)"
              placeholder="https://miempresa.com/logo.png"
              {...register("logoUrl")}
              error={!!errors.logoUrl}
              helperText={errors.logoUrl?.message}
            />

            <UploadLogoForm logoUrl={watch("logoUrl")} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <EstablishmentForm />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <EmissionPointForm />
          </Grid>
        </Grid>

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ alignSelf: "flex-start", mt: 2 }}
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
    </Box>
  );
}
