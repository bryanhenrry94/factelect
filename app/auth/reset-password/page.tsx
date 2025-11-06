"use client";

import {
  Box,
  Container,
  CssBaseline,
  Typography,
  Button,
  Alert,
  Card,
  Grid,
  Paper,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/app/actions/auth";
import PageContainer from "@/components/container/PageContainer";
import Logo from "@/components/layout/shared/logo/Logo";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import CustomTextField from "@/components/ui/CustomTextField";
import { protocol } from "@/lib/config";

type ResetPasswordForm = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage = () => {
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("Token de restablecimiento no válido");
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordForm) => {
    setError("");
    setLoading(true);

    if (data.password !== data.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword(token, data.password);

      if (!response.success) {
        throw new Error(response.message || "Error al restablecer contraseña");
      }

      setSuccess(true);

      router.push("/auth/signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Contraseña restablecida exitosamente. Redirigiendo...
            </Alert>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <PageContainer
      title="Restablecer contraseña"
      description="this is Reset Password page"
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

              <Typography
                variant="subtitle1"
                textAlign="center"
                color="textSecondary"
                mb={1}
              >
                Ingresa tu nueva contraseña a continuación.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{ mt: 1 }}
              >
                <Box>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    component="label"
                    htmlFor="email"
                    mb="5px"
                  >
                    Contraseña
                  </Typography>
                  <Controller
                    name="password"
                    control={control}
                    rules={{ required: "La contraseña es obligatoria" }}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        id="password"
                        variant="outlined"
                        fullWidth
                        placeholder="Contraseña"
                        type="password"
                        error={!!errors.password}
                        helperText={
                          errors.password ? errors.password.message : ""
                        }
                      />
                    )}
                  />
                </Box>

                <Box mt={3}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    component="label"
                    htmlFor="email"
                    mb="5px"
                  >
                    Confirmar Contraseña
                  </Typography>
                  <Controller
                    name="confirmPassword"
                    control={control}
                    rules={{
                      required: "Debes confirmar la contraseña",
                      validate: (value) =>
                        value === watch("password") ||
                        "Las contraseñas no coinciden",
                    }}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        id="confirmPassword"
                        variant="outlined"
                        fullWidth
                        placeholder="Confirmar Contraseña"
                        type="password"
                        error={!!errors.confirmPassword}
                        helperText={
                          errors.confirmPassword
                            ? errors.confirmPassword.message
                            : ""
                        }
                      />
                    )}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                  disabled={loading || !token}
                >
                  {loading ? "Procesando..." : "Restablecer contraseña"}
                </Button>

                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Link href="/auth/signin" style={{ textDecoration: "none" }}>
                    <Button
                      variant="text"
                      color="primary"
                      sx={{ textTransform: "none" }}
                    >
                      Inicio de sesión
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
};

export default ResetPasswordPage;
