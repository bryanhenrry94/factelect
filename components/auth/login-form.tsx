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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useTenant from "@/hooks/useTenant";
import { Controller, useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LucideMessageCircleWarning } from "lucide-react";

interface LoginFormInputs {
  username: string;
  password: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const { tenant } = useTenant();
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const rawEmail = searchParams?.get("email") ?? undefined;
  const email = rawEmail
    ? decodeURIComponent(rawEmail).trim().toLowerCase()
    : undefined;

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
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

  useEffect(() => {
    if (!email) return;

    reset({ username: email });
  }, [email, reset]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenido de nuevo</CardTitle>
          <CardDescription>Inicia sesión con tu email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              {/* <Field>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Iniciar sesión con Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                O continúa con
              </FieldSeparator> */}
              <Field>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Controller
                  name="username"
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
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <a
                    href="/auth/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="password"
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      required
                      {...field}
                    />
                  )}
                />
              </Field>
              {error && (
                <Alert variant="destructive">
                  <LucideMessageCircleWarning />
                  <AlertTitle>¡Atención!</AlertTitle>
                  <AlertDescription>
                    Credenciales inválidas. Por favor verifica tu correo y
                    contraseña.
                  </AlertDescription>
                </Alert>
              )}
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
                <FieldDescription className="text-center">
                  ¿No tienes una cuenta? <a href="/auth/signup">Regístrate</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Al hacer clic en iniciar sesión, aceptas nuestros{" "}
        <a href="#">Términos de servicio</a> y{" "}
        <a href="#">Política de privacidad</a>.
      </FieldDescription>
    </div>
  );
}
