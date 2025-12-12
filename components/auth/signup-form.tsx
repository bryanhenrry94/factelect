"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import { SignupData } from "@/lib/validations/auth/signup";
import { signup } from "@/actions";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { useRouter } from "next/navigation";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const { control, handleSubmit, formState } = useForm<SignupData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupData) => {
    console.log("Signup data:", data);
    const rest = await signup(data);

    if (!rest.success) {
      notifyError(rest.error || "Error al crear la cuenta");
      return;
    }

    notifyInfo("Cuenta creada exitosamente.");
    router.push("/onboarding?email=" + encodeURIComponent(data.email));
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
          <CardDescription>
            Ingresa tus datos para registrarte en la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      {...field}
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      {...field}
                    />
                  )}
                />
              </Field>
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    <Controller
                      name="password"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="password"
                          type="password"
                          required
                          {...field}
                        />
                      )}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirmar contraseña
                    </FieldLabel>
                    <Controller
                      name="confirmPassword"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="confirm-password"
                          type="password"
                          required
                          {...field}
                        />
                      )}
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  La contraseña debe tener al menos 8 caracteres.
                </FieldDescription>
              </Field>
              <Field>
                <Button type="submit">Crear cuenta</Button>
                <FieldDescription className="text-center">
                  ¿Ya tienes una cuenta?{" "}
                  <a href="/auth/signin">Iniciar sesión</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Al hacer clic en continuar, aceptas nuestros{" "}
        <a href="#">Términos de servicio</a> y nuestra{" "}
        <a href="#">Política de privacidad</a>.
      </FieldDescription>
    </div>
  );
}
