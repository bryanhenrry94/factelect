"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";

import { resetPassword } from "@/actions/auth";
import { protocol } from "@/lib/config";

import PageContainer from "@/components/container/PageContainer";
import Logo from "@/components/layout/shared/logo/Logo";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import Link from "next/link";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";

type ResetPasswordForm = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordPage() {
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
        throw new Error(
          response.message || "Error al restablecer la contraseña"
        );
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
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="p-6 max-w-sm w-full">
          <Alert variant="default">
            <AlertTitle>Contraseña restablecida</AlertTitle>
            <AlertDescription>
              Redirigiendo al inicio de sesión...
            </AlertDescription>
          </Alert>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card className="p-6 w-full max-w-md relative z-10 shadow-lg">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>

          <p className="text-center text-sm text-muted-foreground mb-3">
            Ingresa tu nueva contraseña a continuación.
          </p>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <FieldSet>
                {/* Password */}
                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <Controller
                    name="password"
                    control={control}
                    rules={{ required: "La contraseña es obligatoria" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        placeholder="Contraseña"
                        required
                      />
                    )}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </Field>

                {/* Confirm Password */}
                <Field>
                  <FieldLabel htmlFor="confirmPassword">
                    Confirmar contraseña
                  </FieldLabel>
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
                      <Input
                        {...field}
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirmar contraseña"
                        required
                      />
                    )}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </Field>
              </FieldSet>

              <Field orientation="vertical">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !token}
                >
                  {loading ? "Procesando..." : "Restablecer contraseña"}
                </Button>
                <div className="text-center mt-2">
                  <Link href="/auth/signin" className="text-primary text-sm">
                    Regresar al inicio de sesión
                  </Link>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </Card>
      </div>
    </div>
  );
}
