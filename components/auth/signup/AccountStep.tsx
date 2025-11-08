import { Box, Fade, Grid, TextField, Typography } from "@mui/material";
import { Controller } from "react-hook-form";

type StepProps = {
  control: any;
  errors: any;
};

export const AccountStep: React.FC<StepProps> = ({ control, errors }) => (
  <Fade in>
    <Box sx={{ mt: 4 }}>
      <Typography variant="subtitle1" textAlign={"center"}>
        (1/3)
      </Typography>
      <Typography
        variant="h5"
        fontWeight={600}
        gutterBottom
        textAlign={"center"}
      >
        Crea tu cuenta en Factelect
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        mb={3}
      >
        Ingresa tus datos personales para acceder al sistema.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="name"
            control={control}
            rules={{ required: "El nombre es obligatorio" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nombre completo"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                value={field.value ?? ""}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="email"
            control={control}
            rules={{
              required: "El correo es obligatorio",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Correo inválido",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Correo electrónico"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                value={field.value ?? ""}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Controller
            name="password"
            control={control}
            rules={{
              required: "La contraseña es obligatoria",
              minLength: {
                value: 6,
                message: "Debe tener al menos 6 caracteres",
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contraseña"
                type="password"
                fullWidth
                error={!!errors.password}
                helperText={errors.password?.message}
                value={field.value ?? ""}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  </Fade>
);
