"use client";

import { registerAccount } from "@/actions/auth";
import { TenantStep } from "@/components/onboarding/TenantStep";
import { TermsStep } from "@/components/onboarding/TermsStep";
import Logo from "@/components/layout/shared/logo/Logo";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { protocol, rootDomain } from "@/lib/config";

const steps = ["Empresa", "Confirmación"];

type FormValues = {
  ruc: string;
  tenantName: string;
  tenantAddress: string;
  acceptTerms: boolean;
};

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = (params.get("email") as string) || "";

  const [activeStep, setActiveStep] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState("");

  const {
    handleSubmit,
    control,
    trigger,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onTouched",
  });

  const handleNext = async () => {
    const fields =
      activeStep === 0
        ? ["ruc", "tenantName", "tenantAddress"]
        : activeStep === 1
        ? ["acceptTerms"]
        : [];

    const valid = await trigger(fields as any);
    if (!valid) return;

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleStart = () => {
    const ruc = getValues("ruc");
    router.push(`${protocol}://${ruc}.${rootDomain}/auth/signin`);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (!email) {
        setError("Email no proporcionado.");
        return;
      }

      const res = await registerAccount(email, data);

      if (!res.success) {
        setError(res.error || "Error al crear cuenta.");
        return;
      }

      setIsFinished(true);
      setActiveStep(steps.length);
    } catch {
      setError("Error inesperado");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/20">
      {/* Logo */}
      <div className="mb-4">
        <Logo />
      </div>

      <Card className="w-full max-w-md border border-muted shadow-sm">
        <CardContent className="p-6">
          {!isFinished ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Steps */}
              <div className="flex justify-center gap-2 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i === activeStep ? "bg-primary" : "bg-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>

              {/* STEP VIEWS */}
              {activeStep === 0 && (
                <TenantStep control={control} errors={errors} />
              )}
              {activeStep === 1 && (
                <TermsStep control={control} errors={errors} />
              )}

              {/* Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  type="button"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Atrás
                </Button>

                {activeStep < steps.length - 1 ? (
                  <Button onClick={handleNext} disabled={isSubmitting}>
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !watch("acceptTerms")}
                  >
                    {isSubmitting ? "Guardando..." : "Finalizar"}
                  </Button>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                🔒 Tus datos están protegidos con cifrado SSL.
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />

              <h2 className="text-xl font-semibold">
                ¡Cuenta creada con éxito!
              </h2>
              <p className="text-sm text-muted-foreground">
                Ya puedes ingresar a tu entorno de facturación.
              </p>

              <Button className="mt-3 w-full" onClick={handleStart}>
                Acceder a mi cuenta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm mt-4 text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <a href="/auth/signin" className="text-primary hover:underline">
          Iniciar sesión
        </a>
      </p>
    </div>
  );
}
