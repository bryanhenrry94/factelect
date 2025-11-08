"use client";

import { createAccount } from "@/app/actions/auth";
import { AccountStep } from "@/components/auth/signup/AccountStep";
import { TenantStep } from "@/components/auth/signup/TenantStep";
import { TermsStep } from "@/components/auth/signup/TermsStep";
import PageContainer from "@/components/container/PageContainer";
import Logo from "@/components/layout/shared/logo/Logo";
import { protocol, rootDomain } from "@/lib/config";
import {
  Box,
  Button,
  Card,
  Grid,
  Step,
  StepLabel,
  Stepper,
  Typography,
  CircularProgress,
  Stack,
  Slide,
  Alert,
} from "@mui/material";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";

const steps = ["Cuenta de acceso", "Datos del contribuyente", "Confirmación"];

type FormValues = {
  name: string;
  email: string;
  password: string;
  ruc: string;
  tenantName: string;
  tenantAddress: string;
  acceptTerms: boolean;
};

export default function SignupPage() {
  const router = useRouter();

  const [activeStep, setActiveStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const {
    handleSubmit,
    control,
    trigger,
    formState: { errors },
    getValues,
    watch,
  } = useForm<FormValues>({ mode: "onTouched" });

  const handleNext = async () => {
    // Validar campos del paso actual
    const currentStepFields =
      activeStep === 0
        ? ["name", "email", "password"]
        : activeStep === 1
        ? ["ruc", "tenantName", "tenantAddress"]
        : [];

    const isStepValid = await trigger(currentStepFields as any);
    if (!isStepValid) return;

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleStart = () => {
    const ruc = getValues("ruc");

    const redirectUrl = `${protocol}://${ruc}.${rootDomain}/auth/signin`;
    router.push(redirectUrl);
    // setActiveStep(0);
    // setIsFinished(false);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      const response = await createAccount(data);

      if (!response.success) {
        setError(response.error || "Error al crear la cuenta.");
        return;
      }

      setIsFinished(true);
      setActiveStep(steps.length);
    } catch (error) {
      console.error(error);
      setError("Error al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="Registrarse"
      description="Crea tu cuenta en Factelect"
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              justifyContent: "space-between",
              height: "90vh",
              p: { xs: 3, md: 4 },
            }}
          >
            {/* Logo */}
            <Box
              display="flex"
              justifyContent="center"
              mb={3}
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Logo />
            </Box>

            {/* Stepper */}
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Stepper
                activeStep={activeStep}
                orientation="vertical"
                sx={{
                  mb: 3,

                  "& .MuiStepLabel-label": {
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    color: "text.primary",
                    marginTop: "8px",
                    lineHeight: 1.3,
                  },
                }}
              >
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel
                      sx={{
                        "& .MuiStepLabel-iconContainer": {
                          paddingRight: "12px",
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* Login Link */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              mt={3}
              sx={{ position: "relative", zIndex: 1 }}
            >
              <Typography color="textSecondary" variant="body1">
                ¿Ya tienes una cuenta?
              </Typography>
              <Typography
                component={Link}
                href="/auth/signin"
                fontWeight="600"
                sx={{
                  textDecoration: "none",
                  color: "primary.main",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Inicia sesión
              </Typography>
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
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
                  lg: 12,
                  xl: 12,
                }}
              >
                <Card
                  elevation={9}
                  sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: "500px" }}
                >
                  {!isFinished ? (
                    <form onSubmit={handleSubmit(onSubmit)}>
                      <Slide direction="left" in mountOnEnter unmountOnExit>
                        <Box>
                          {activeStep === 0 && (
                            <AccountStep control={control} errors={errors} />
                          )}
                          {activeStep === 1 && (
                            <TenantStep control={control} errors={errors} />
                          )}
                          {activeStep === 2 && (
                            <TermsStep control={control} errors={errors} />
                          )}
                        </Box>
                      </Slide>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mt: 3, display: "block" }}
                      >
                        🔒 Tus datos están protegidos con cifrado SSL y se
                        usarán solo para la creación de tu cuenta.
                      </Typography>

                      {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {error}
                        </Alert>
                      )}

                      <Box display="flex" justifyContent="space-between" mt={2}>
                        <Button
                          variant="outlined"
                          disabled={activeStep === 0}
                          onClick={handleBack}
                        >
                          Atrás
                        </Button>

                        {activeStep < steps.length - 1 ? (
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={isLoading}
                            sx={{
                              textTransform: "none",
                              "&:hover": {
                                boxShadow: "0 4px 12px rgba(76,111,255,0.3)",
                              },
                            }}
                          >
                            {isLoading ? "Validando..." : "Siguiente"}
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            disabled={isLoading || !watch("acceptTerms")}
                            startIcon={
                              isLoading && <CircularProgress size={18} />
                            }
                          >
                            {isLoading ? "Guardando..." : "Crear cuenta"}
                          </Button>
                        )}
                      </Box>
                    </form>
                  ) : (
                    <Box textAlign="center" mt={3}>
                      <CheckCircle color="#ECF2FF" size={64} />

                      <Typography variant="h6" fontWeight={600} mt={2}>
                        ¡Tu cuenta ha sido creada con éxito!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ya puedes acceder a tu entorno de facturación
                        electrónica.
                      </Typography>
                      <Button
                        variant="contained"
                        sx={{ mt: 3, textTransform: "none" }}
                        onClick={handleStart}
                      >
                        Acceder a mi cuenta
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
