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
/* Removed unused Avatar and Alert imports */
import { Label } from "@/components/ui/label";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, User } from "lucide-react";

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
      <Card>
        <CardHeader>
          <CardTitle>Perfil de Usuario</CardTitle>
          <CardDescription>
            Gestiona tu información personal y configuración de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            {/* Tabs Header */}
            <TabsList className="mb-6 flex w-full justify-start gap-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>

              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Seguridad
              </TabsTrigger>
            </TabsList>

            {/* Perfil */}
            <TabsContent value="profile" className="mt-0">
              <FieldSet>
                <FieldLegend>Detalles del Perfil</FieldLegend>
                <FieldDescription>
                  Modifica tu nombre de usuario según sea necesario.
                </FieldDescription>

                <div className="space-y-4">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={userInfo.name}
                      onChange={(e) => setUserInfo({ name: e.target.value })}
                      placeholder="Ingresa tu nombre"
                    />
                  </div>

                  {/* Acciones */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setUserInfo({
                          name: session?.user?.name ?? "",
                        })
                      }
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>Guardar cambios</Button>
                  </div>
                </div>
              </FieldSet>
            </TabsContent>

            {/* Seguridad */}
            <TabsContent value="security" className="mt-0">
              <FieldSet>
                <FieldLegend>Cambiar Contraseña</FieldLegend>
                <FieldDescription>
                  Actualiza tu contraseña regularmente para mantener la
                  seguridad de tu cuenta
                </FieldDescription>
                <ChangePasswordForm userId={session?.user?.id ?? ""} />
              </FieldSet>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardContent>
          <FieldGroup></FieldGroup>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
