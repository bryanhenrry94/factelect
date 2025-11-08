"use client";

import { TenantStep } from "@/components/auth/signup/TenantStep";
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
  Fade,
  CircularProgress,
  TextField,
  Stack,
  Slide,
} from "@mui/material";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm, Controller } from "react-hook-form";

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

type StepProps = {
  control: any;
  errors: any;
};

const AccountStep: React.FC<StepProps> = ({ control, errors }) => (
  <Fade in>
    <Box sx={{ mt: 4 }}>
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

const TermsStep: React.FC<StepProps> = ({ control, errors }) => {
  return (
    <Fade in>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" textAlign="center" fontWeight={600}>
          Términos y Condiciones
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          mb={3}
        >
          Acepta nuestros términos para completar tu registro.
        </Typography>

        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1, mb: 3 }}>
          <Typography variant="body2" paragraph>
            Al registrarte en Factelect, aceptas nuestros términos de servicio y
            política de privacidad. Tu información será tratada con la máxima
            confidencialidad y utilizada únicamente para la prestación de
            nuestros servicios de facturación electrónica.
          </Typography>
          <Typography variant="body2">
            Para más detalles, puedes revisar nuestros{" "}
            <Typography
              component="a"
              href="/terms"
              color="primary"
              sx={{ textDecoration: "none" }}
            >
              términos completos
            </Typography>{" "}
            y{" "}
            <Typography
              component="a"
              href="/privacy"
              color="primary"
              sx={{ textDecoration: "none" }}
            >
              política de privacidad
            </Typography>
            .
          </Typography>

          <Controller
            name="acceptTerms"
            control={control}
            rules={{ required: "Debes aceptar los términos y condiciones" }}
            render={({ field }) => (
              <Box sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={field.value || false}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <Typography
                    component="label"
                    htmlFor="acceptTerms"
                    variant="body2"
                    sx={{ cursor: "pointer" }}
                  >
                    Acepto los términos y condiciones de uso
                  </Typography>
                </Box>
                {errors.acceptTerms && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 1, display: "block" }}
                  >
                    {errors.acceptTerms?.message}
                  </Typography>
                )}
              </Box>
            )}
          />
        </Box>
      </Box>
    </Fade>
  );
};

export default function SignupPage() {
  const router = useRouter();

  const {
    handleSubmit,
    control,
    trigger,
    formState: { errors },
    getValues,
    watch,
  } = useForm<FormValues>({ mode: "onTouched" });

  const [activeStep, setActiveStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);

  const handleNext = async () => {
    // Validar campos del paso actual
    const currentStepFields =
      activeStep === 0
        ? ["name", "email", "password"]
        : activeStep === 1
        ? ["ruc", "tenantName", "tenantAddress"]
        : [];

    console.log("Validando campos:", currentStepFields);

    const isStepValid = await trigger(currentStepFields as any);
    if (!isStepValid) return;

    console.log("Datos del paso actual:", getValues());

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
    setIsLoading(true);
    console.log("Datos completos:", data);

    // Simula envío al backend
    setTimeout(() => {
      setIsLoading(false);
      setIsFinished(true);
      setActiveStep(steps.length);
    }, 1500);
  };

  return (
    <PageContainer
      title="Registrarse"
      description="Crea tu cuenta en Factelect"
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
              <Box display="flex" justifyContent="center" mb={3}>
                <Logo />
              </Box>

              <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{
                  mb: 3,
                  "& .MuiStepIcon-root.Mui-active": {
                    color: "primary.main",
                    transform: "scale(1.1)",
                    transition: "all 0.3s ease",
                  },
                  "& .MuiStepConnector-line": {
                    borderColor: "rgba(0,0,0,0.1)",
                  },
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

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
                    🔒 Tus datos están protegidos con cifrado SSL y se usarán
                    solo para la creación de tu cuenta.
                  </Typography>

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
                        startIcon={isLoading && <CircularProgress size={18} />}
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
                    Ya puedes acceder a tu entorno de facturación electrónica.
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

              {!isFinished && (
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="center"
                  mt={3}
                >
                  <Typography
                    color="textSecondary"
                    variant="h6"
                    fontWeight="500"
                  >
                    Ya tienes una cuenta?
                  </Typography>
                  <Typography
                    component={Link}
                    href="/auth/signin"
                    fontWeight="500"
                    sx={{
                      textDecoration: "none",
                      color: "primary.main",
                    }}
                  >
                    Iniciar sesión
                  </Typography>
                </Stack>
              )}
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
