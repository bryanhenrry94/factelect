"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";

/* shadcn */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteInvitation,
  getInvitationsByTenant,
  inviteUser,
} from "@/actions/tenant-invitation";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { changeActiveStatus, getUsers } from "@/actions";
import { useSession } from "next-auth/react";
import { TenantInvitation } from "@/lib/validations/tenant-invitation";
import { formatDate } from "@/utils/formatters";
import { Delete } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const { data: session } = useSession();

  const handleInvite = async () => {
    if (!inviteEmail) return;
    if (!session?.user.tenantId) return;

    await inviteUser(session?.user.tenantId, inviteEmail);

    notifyInfo("Invitación enviada a " + inviteEmail);
    setInviteEmail("");
    getInvitations();
  };

  const loadUsers = async () => {
    if (!session?.user.tenantId) return;

    const res = await getUsers(session?.user.tenantId);
    if (res.success && res.users) {
      setUsers(res.users);
    }
  };

  const getInvitations = async () => {
    if (!session?.user.tenantId) return;

    const res = await getInvitationsByTenant(session?.user.tenantId);
    if (res.success && res.invitations) {
      setInvitations(res.invitations);
    }
  };

  useEffect(() => {
    loadUsers();
    getInvitations();
  }, [session?.user.id]);

  const toggleActive = async (id: number, isActive: boolean) => {
    const res = await changeActiveStatus(id.toString(), !isActive);
    if (res.success) {
      notifyError(isActive ? "Usuario desactivado" : "Usuario activado");
      loadUsers();
    } else {
      notifyError(res.error || "Error al cambiar el estado del usuario");
    }
  };

  const handleInvitationDelete = async (invitationId: string) => {
    try {
      const confirm = await ConfirmDialog.confirm(
        "Aviso",
        "Estas seguro de eliminar la invitacion?"
      );

      if (!confirm) return;

      await deleteInvitation(invitationId);
      notifyInfo("Invitación eliminada");
      getInvitations();
    } catch (error) {
      notifyError("Error al eliminar la invitación");
    }
  };

  return (
    <PageContainer
      title="Usuarios"
      description="Administra los usuarios con acceso a tu organización"
    >
      <div className="space-y-6">
        {/* Invitar usuario */}
        <Card>
          <CardHeader>
            <CardTitle>Invitar Usuario</CardTitle>
            <CardDescription>
              Envía una invitación por correo electrónico.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Input
              type="email"
              placeholder="correo@empresa.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={handleInvite}>Invitar</Button>
          </CardContent>
        </Card>

        {/* Tabla de invitaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones Enviadas</CardTitle>
            <CardDescription>Lista de invitaciones pendientes.</CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo</TableHead>
                  <TableHead>Fecha Envío</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      No hay invitaciones pendientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        {formatDate(invitation.createdAt.toString())}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleInvitationDelete(invitation.id)}
                        >
                          <Delete className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabla de usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios Registrados</CardTitle>
            <CardDescription>
              Lista de usuarios con acceso al sistema.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className={!user.active ? "bg-muted/50" : ""}
                    >
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={user.active ? "outline" : "default"}
                          onClick={() => toggleActive(user.id, user.active)}
                        >
                          {user.active ? "Desactivar" : "Activar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
