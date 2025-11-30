"use client";

import { sendPasswordResetEmail } from "@/actions/auth";
import PageContainer from "@/components/container/PageContainer";
import Logo from "@/components/layout/shared/logo/Logo";
import CustomTextField from "@/components/ui/CustomTextField";
import { Alert, Box, Button, Card, Grid, Typography } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

type FormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { email: "" },
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const result = await sendPasswordResetEmail(data.email);

      if (!result.success) {
        setError(result.message || "Error al enviar el correo de recuperación");
        return;
      }

      setMessage(
        result.message ||
          "Si el correo existe, se enviará un enlace de restablecimiento."
      );
      reset(); // Limpia el formulario tras enviar
    } catch {
      setError("Ha ocurrido un error inesperado. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="Recuperar contraseña"
      description="this is Forgot Password page"
    >
      <Box
        sx={{
          position: "relative",
          "&:before": {
            content: '""',
            background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
            backgroundSize: "400% 400%",
            animation: "gradient 15s ease infinite",
            position: "absolute",
            height: "100%",
            width: "100%",
            opacity: "0.3",
          },
        }}
      >
        <Grid
          container
          spacing={0}
          justifyContent="center"
          sx={{ height: "100vh" }}
        >
          <Grid
            display="flex"
            justifyContent="center"
            alignItems="center"
            size={{
              xs: 12,
              sm: 12,
              lg: 4,
              xl: 3,
            }}
          >
            <Card
              elevation={9}
              sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: "500px" }}
            >
              <Box display="flex" alignItems="center" justifyContent="center">
                <Logo />
              </Box>

              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <Typography
                  variant="subtitle1"
                  textAlign="center"
                  color="textSecondary"
                  mb={1}
                >
                  Recupera el acceso a tu cuenta ingresando tu correo
                </Typography>
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    component="label"
                    htmlFor="email"
                    mb="5px"
                  >
                    Correo
                  </Typography>
                  <Controller
                    name="email"
                    control={control}
                    rules={{ required: "El correo es obligatorio" }}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        id="email"
                        variant="outlined"
                        fullWidth
                        placeholder="Ingresa tu correo"
                        error={!!errors.email}
                        helperText={errors.email ? errors.email.message : ""}
                      />
                    )}
                  />
                </Box>

                {message && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                >
                  {isLoading ? "Enviando..." : "Enviar correo"}
                </Button>

                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Link href="/auth/signin" style={{ textDecoration: "none" }}>
                    <Button
                      variant="text"
                      color="primary"
                      sx={{ textTransform: "none" }}
                      startIcon={<ArrowLeft />}
                    >
                      Regresar al inicio de sesión
                    </Button>
                  </Link>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
