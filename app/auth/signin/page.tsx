"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CssBaseline,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Container,
  CircularProgress,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import useTenant from "@/hooks/useTenant";
import { identifyTenantAction } from "@/app/actions/auth";
import { protocol, rootDomain } from "@/lib/config";

interface FormData {
  email: string;
  password: string;
}

export default function SignInPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { tenant, loading: loadingTenant, error: tenantError } = useTenant();

  const handleInputChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingLogin(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
      subdomain: tenant?.subdomain,
    });

    setLoadingLogin(false);

    if (res?.error) {
      setError("Credenciales inválidas. Por favor, intenta de nuevo.");
    } else {
      router.push(callbackUrl);
    }
  };

  const handleIdentifyTenant = async () => {
    startTransition(async () => {
      const res = await identifyTenantAction(formData.email);
      if (res.success && res.subdomain) {
        router.push(
          `${protocol}://${
            res.subdomain
          }.${rootDomain}/auth/signin?email=${encodeURIComponent(
            formData.email
          )}`
        );
      } else {
        setError(
          "No se pudo identificar la empresa. Verifica el correo e intenta de nuevo."
        );
      }
    });
  };

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  if (loadingTenant) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: "center", mt: 20 }}>
        <CssBaseline />
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>
          Cargando información de la empresa...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 400 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Iniciar Sesión
          </Typography>

          {tenant ? (
            <>
              <Typography variant="body1" align="center">
                {tenant?.name || "la plataforma"}
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {tenantError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {tenantError}
                </Alert>
              )}
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  type="email"
                  label="Correo electrónico"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  required
                  margin="normal"
                  variant="outlined"
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Contraseña"
                  value={formData.password}
                  onChange={handleInputChange("password")}
                  required
                  margin="normal"
                  variant="outlined"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loadingLogin}
                >
                  {loadingLogin ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>
              </Box>
              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="body2">
                  <Link href="/auth/forgot-password" underline="hover">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  ¿No tienes cuenta?{" "}
                  <Link href="/auth/signup" underline="hover">
                    Regístrate
                  </Link>
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                Ingresa tu correo para identificar tu empresa
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <TextField
                fullWidth
                type="email"
                label="Correo electrónico"
                value={formData.email}
                onChange={handleInputChange("email")}
                required
                margin="normal"
                variant="outlined"
              />
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleIdentifyTenant}
                disabled={isPending || !formData.email}
              >
                {isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Continuar"
                )}
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
