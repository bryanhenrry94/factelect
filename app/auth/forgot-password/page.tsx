"use client";

import { sendPasswordResetEmail } from "@/actions/auth";
import PageContainer from "@/components/container/PageContainer";
import Logo from "@/components/layout/shared/logo/Logo";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import Link from "next/link";
import { ArrowLeft, Mail, MessageCircleWarning } from "lucide-react";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";

type FormValues = {
  email: string;
};

export default function ForgotPasswordPage() {
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "" },
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (data: FormValues) => {
    setMessage("");
    setError("");

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

      reset();
    } catch {
      setError("Ha ocurrido un error inesperado. Por favor intenta de nuevo.");
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center h-full px-4 relative">
          <Card className="w-full max-w-md p-6 z-10 shadow-lg">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <Logo />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>

                    <Controller
                      name="email"
                      control={control}
                      rules={{ required: "El correo es obligatorio" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="Ingresa tu correo"
                          required
                        />
                      )}
                    />

                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                    <FieldDescription>
                      Recupera el acceso a tu cuenta ingresando tu correo
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldSet>

              {/* Mensaje de éxito */}
              {message && (
                <Alert className="border-green-400">
                  <Mail />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {/* Mensaje de error */}
              {error && (
                <Alert variant="destructive">
                  <MessageCircleWarning className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar correo"}
              </Button>

              <div className="text-center">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="gap-2">
                    <ArrowLeft size={18} />
                    Regresar al inicio de sesión
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
