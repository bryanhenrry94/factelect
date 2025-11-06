"use client";

import React from "react";
import { Box, Typography, Button, Stack, Alert } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";

import CustomTextField from "@/components/ui/CustomTextField";
import useTenant from "@/hooks/useTenant";

interface LoginFormInputs {
  username: string;
  password: string;
}

interface LoginProps {
  title?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
}

const AuthLogin = ({ title, subtitle, subtext }: LoginProps) => {
  const router = useRouter();
  const { tenant } = useTenant();
  const [error, setError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginFormInputs>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setError(null);

    const { username, password } = data;

    const response = await signIn("credentials", {
      email: username,
      password,
      subdomain: tenant?.subdomain,
      redirect: false,
    });

    console.log("response", response);

    if (response?.error) {
      setError("Credenciales inválidas.");
      return;
    }

    router.push("/");
  };

  return (
    <>
      {title && (
        <Typography fontWeight={700} variant="h2" mb={1}>
          {title}
        </Typography>
      )}

      {subtext}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              component="label"
              htmlFor="username"
              mb="5px"
            >
              Correo
            </Typography>
            <Controller
              name="username"
              control={control}
              rules={{ required: "El correo es obligatorio" }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  id="username"
                  variant="outlined"
                  fullWidth
                  placeholder="Ingresa tu correo"
                  error={!!errors.username}
                  helperText={errors.username ? errors.username.message : ""}
                />
              )}
            />
          </Box>

          <Box mt="25px">
            <Typography
              variant="subtitle1"
              fontWeight={600}
              component="label"
              htmlFor="password"
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
                  type="password"
                  variant="outlined"
                  fullWidth
                  placeholder="Ingresa tu contraseña"
                  error={!!errors.password}
                  helperText={errors.password ? errors.password.message : ""}
                />
              )}
            />
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack
            justifyContent="flex-end"
            direction="row"
            alignItems="center"
            my={2}
          >
            <Typography
              component={Link}
              href="/auth/forgot-password"
              fontWeight={500}
              sx={{
                textDecoration: "none",
                color: "primary.main",
              }}
            >
              ¿Has olvidado tu contraseña?
            </Typography>
          </Stack>
        </Stack>

        <Box>
          <Button
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Iniciando..." : "Iniciar Sesión"}
          </Button>
        </Box>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthLogin;
