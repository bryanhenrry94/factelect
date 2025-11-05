"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  Paper,
  IconButton,
  Box,
  Container,
  Alert,
} from "@mui/material";
import { Edit, Delete, Users, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

import { deleteClient, getClientsByTenant } from "@/app/actions/client";
import { ClientReponse } from "@/lib/validations/client";
import ClientFormDialog from "@/components/client/client-form-dialog";
import { AlertService } from "@/lib/alerts";

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<ClientReponse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientReponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    if (!session?.user?.tenantId) return;
    const response = await getClientsByTenant(session.user.tenantId);
    if (response.success) setClients(response.data);
  }, [session?.user?.tenantId]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleAdd = () => {
    setEditingClient(null);
    setDialogOpen(true);
  };

  const handleEdit = (client: ClientReponse) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingClient(null);
  };

  const handleDelete = (clientId: string) => {
    AlertService.showConfirm(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.",
      "Eliminar",
      "Cancelar"
    ).then(async (confirmed) => {
      if (confirmed) {
        // Lógica para eliminar el cliente
        await deleteClient(clientId);
        AlertService.showSuccess("Cliente eliminado exitosamente.");
        // Recargar la lista de clientes después de la eliminación
        await loadClients();
      }
    });
  };

  return (
    <Container maxWidth="lg">
      {/* HEADER */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4">Clientes</Typography>
          <Typography variant="body2" color="text.secondary">
            Administra las relaciones con tus clientes
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus />} onClick={handleAdd}>
          Agregar Cliente
        </Button>
      </Box>

      {/* DIALOGO FORMULARIO */}
      <ClientFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={loadClients}
        editingClient={editingClient}
        tenantId={session?.user?.tenantId ?? ""}
        setError={setError}
      />

      {/* TABLA */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {clients.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Users />
              <Typography variant="h6" mt={2}>
                No hay clientes aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega tu primer cliente
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Identificación</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nombre</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Correo</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Teléfono</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} hover>
                      <TableCell>{client.identification}</TableCell>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone || "-"}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
}
