"use client";

import { getOnboardingStatus, identifyTenantAction } from "@/actions/auth";
import { protocol, rootDomain } from "@/lib/config";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/field";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { LucideMessageCircleWarning } from "lucide-react";
import { Logo } from "@/components/logo";
import { userExists } from "@/actions";

type FormValues = {
  email: string;
};

export default function IdentifyTenant({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: "" },
  });

  const [error, setError] = useState("");

  const onSubmit = async (data: FormValues) => {
    setError("");

    try {
      const exists = await userExists(data.email);
      if (!exists) {
        setError("El correo electrónico no está registrado.");
        return;
      }

      // Check if onboarding is complete
      const onboardingStatus = await getOnboardingStatus(data.email);
      console.log("Onboarding status:", onboardingStatus);
      if (!onboardingStatus.onboardingCompleted) {
        console.log("Redirecting to onboarding for:", data.email);
        router.push(`/onboarding?email=${encodeURIComponent(data.email)}`);
        return;
      }

      const result = await identifyTenantAction(data.email);

      if (!result.success) {
        setError(result.message || "Error por favor intenta de nuevo.");
        return;
      }

      // Redirect to the tenant's subdomain signin page
      const redirectUrl = `${protocol}://${
        result.subdomain
      }.${rootDomain}/auth/signin?email=${encodeURIComponent(data.email)}`;

      router.push(redirectUrl);
    } catch {
      setError("Ha ocurrido un error inesperado. Por favor intenta de nuevo.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="p-4">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <FieldGroup>
          <FieldSet>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@ejemplo.com"
                        required
                        {...field}
                      />
                    )}
                  />
                  <FieldDescription>
                    Ingresa el correo asociado a tu cuenta.
                  </FieldDescription>
                </Field>

                {error && (
                  <Alert variant="destructive">
                    <LucideMessageCircleWarning />
                    <AlertTitle>¡Atención!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Field>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Validando..." : "Continuar"}
                  </Button>
                  <FieldDescription className="text-center">
                    ¿No tienes una cuenta? <a href="/auth/signup">Regístrate</a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </FieldSet>
        </FieldGroup>
      </Card>
    </div>
  );
}
