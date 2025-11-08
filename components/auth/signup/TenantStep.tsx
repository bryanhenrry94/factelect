import { Box, Fade, Grid, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";

type StepProps = {
  control: any;
  errors: any;
};

export const TenantStep: React.FC<StepProps> = ({ control, errors }) => (
  <Fade in>
    <Box sx={{ mt: 4 }}>
      <Typography variant="subtitle1" textAlign={"center"}>
        (2/3)
      </Typography>
      <Typography variant="h5" textAlign="center" fontWeight={600}>
        Datos del contribuyente
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        mb={3}
      >
        Registra la información de tu empresa para habilitar la facturación
        electrónica.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="ruc"
            control={control}
            rules={{
              required: "El RUC es obligatorio",
              pattern: {
                value: /^\d{13}$/,
                message: "El RUC debe tener 13 dígitos",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="RUC"
                fullWidth
                error={!!errors.ruc}
                helperText={errors.ruc?.message}
                value={field.value ?? ""}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="tenantName"
            control={control}
            rules={{ required: "El nombre de la empresa es obligatorio" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nombre / Razón Social"
                fullWidth
                error={!!errors.tenantName}
                helperText={errors.tenantName?.message}
                value={field.value ?? ""}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="tenantAddress"
            control={control}
            rules={{ required: "La dirección es obligatoria" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Dirección"
                fullWidth
                error={!!errors.tenantAddress}
                helperText={errors.tenantAddress?.message}
                value={field.value ?? ""}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  </Fade>
);
