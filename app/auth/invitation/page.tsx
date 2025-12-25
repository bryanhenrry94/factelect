"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { acceptInvitation, validateToken } from "@/actions/setting/tenant-invitation";
import { notifyInfo } from "@/lib/notifications";

interface InvitationData {
  email: string;
  valid: boolean;
}

export default function InvitationRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInvitation() {
      setLoading(true);
      setError("");

      try {
        const res = await validateToken(token || "");

        if (!res.valid) throw new Error("Invitación inválida o expirada.");
        if (!res.email) throw new Error("Correo de invitación no encontrado.");

        setInvitation({ email: res.email, valid: true });
      } catch (err: any) {
        setError(err.message || "Error al validar la invitación.");
        setInvitation(null);
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchInvitation();
    else {
      setError("Token de invitación no encontrado.");
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await acceptInvitation(token || "", name, password);
      if (!res.success) throw new Error(res.error || "Error al registrar.");

      notifyInfo("Cuenta creada exitosamente. Por favor, inicia sesión.");
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Error durante el registro.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= STATES ================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !invitation?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error de invitación</CardTitle>
            <CardDescription>
              No se pudo continuar con el registro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ================= FORM ================= */

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Completa tus datos para unirte a la organización
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Correo electrónico</label>
              <Input value={invitation?.email} disabled />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creando cuenta..." : "Registrarse"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
