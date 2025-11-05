"use client";

import { sendPasswordResetEmail } from "@/app/actions/auth";
import {
  Alert,
  Box,
  Button,
  Container,
  CssBaseline,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Clear previous messages and set loading state
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const result = await sendPasswordResetEmail(email);

      if (!result.success) {
        setError(result.message || "Error al enviar el correo de recuperación");
        return;
      }

      setMessage(
        result.message ||
          "Si el correo existe, se enviará un enlace de restablecimiento."
      );
      setEmail(""); // Clear email after successful submission
    } catch (err) {
      setError("Ha ocurrido un error inesperado. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Container maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Recuperar contraseña
          </Typography>
          <Typography variant="body2" align="center" sx={{ mb: 3 }}>
            Ingresa tu correo electrónico y te enviaremos un enlace para
            restablecer tu contraseña.
          </Typography>

          <Box component={"form"} onSubmit={handleSubmit} noValidate>
            <TextField
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
            />

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
                >
                  Regresar al inicio de sesión
                </Button>
              </Link>
            </Box>
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
        </Paper>
      </Box>
    </Container>
  );
}
