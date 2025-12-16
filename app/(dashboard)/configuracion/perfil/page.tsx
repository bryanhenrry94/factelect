"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import PageContainer from "@/components/container/PageContainer";
import ChangePasswordForm from "@/components/setting/change-password-form";

import { updateUserProfile } from "@/actions/setting/user";
import { notifyError, notifyInfo } from "@/lib/notifications";

/* shadcn */
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { data: session } = useSession();

  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: session?.user?.name ?? "",
  });

  useEffect(() => {
    setUserInfo({
      name: session?.user?.name ?? "",
    });
  }, [session]);

  const handleSave = async () => {
    const result = await updateUserProfile(
      session?.user?.id ?? "",
      userInfo.name
    );

    if (result.success) {
      notifyInfo("Perfil actualizado correctamente");
      setIsEditing(false);
    } else {
      notifyError(result.error || "Error al actualizar el perfil");
    }
  };

  return (
    <PageContainer title="Perfil" description="Gestión de perfil de usuario">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ===================== */}
        {/* PERFIL / AVATAR */}
        {/* ===================== */}
        <Card>
          <CardHeader>
            <CardTitle>Actualizar Perfil</CardTitle>
            <CardDescription>
              Cambia tu foto de perfil desde aquí
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-28 w-28 text-4xl">
              <AvatarImage
                src={session?.user?.image || undefined}
                alt="Avatar"
              />
              <AvatarFallback>
                {session?.user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2 w-full">
              <Button variant="default" className="w-full" disabled>
                Subir foto
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Eliminar
              </Button>
            </div>

            <Alert>
              <AlertDescription>Funcionalidad en desarrollo</AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground text-center">
              Formatos permitidos: JPG, PNG. Tamaño máximo 2MB.
            </p>
          </CardContent>
        </Card>

        {/* ===================== */}
        {/* CAMBIAR CONTRASEÑA */}
        {/* ===================== */}
        <ChangePasswordForm userId={session?.user?.id ?? ""} />

        {/* ===================== */}
        {/* INFORMACIÓN PERSONAL */}
        {/* ===================== */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Actualiza tu información personal aquí
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={userInfo.name}
                readOnly={!isEditing}
                onChange={(e) => setUserInfo({ name: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>Guardar</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUserInfo({
                        name: session?.user?.name ?? "",
                      });
                      setIsEditing(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Editar perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
