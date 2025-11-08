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
  TableRow,
  IconButton,
  Box,
  Alert,
  TextField,
} from "@mui/material";
import { Edit, Delete, Users, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

import { deleteCustomer, getCustomersByTenant } from "@/app/actions/customer";
import { CustomerReponse } from "@/lib/validations/customer";
import ClientFormDialog from "@/components/customer/customer-form-dialog";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CustomersPage() {
  const { data: session } = useSession();

  const [customers, setCustomers] = useState<CustomerReponse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerReponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!session?.user?.tenantId) return;
    const response = await getCustomersByTenant(session.user.tenantId);
    if (response.success) setCustomers(response.data);
  }, [session?.user?.tenantId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleAdd = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer: CustomerReponse) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = (customerId: string) => {
    AlertService.showConfirm(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.",
      "Eliminar",
      "Cancelar"
    ).then(async (confirmed) => {
      if (confirmed) {
        // Lógica para eliminar el cliente
        await deleteCustomer(customerId);
        AlertService.showSuccess("Cliente eliminado exitosamente.");
        // Recargar la lista de clientes después de la eliminación
        await loadCustomers();
      }
    });
  };

  return (
    <PageContainer
      title="Clientes"
      description="Administra las relaciones con tus clientes"
    >
      {/* HEADER */}
      <PageHeader title="Clientes" />

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField label="Buscar clientes" variant="outlined" size="small" />
        <Button variant="contained" startIcon={<Plus />} onClick={handleAdd}>
          Agregar Cliente
        </Button>
      </Box>

      {/* DIALOGO FORMULARIO */}
      <ClientFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={loadCustomers}
        editingCustomer={editingCustomer}
        tenantId={session?.user?.tenantId ?? ""}
        setError={setError}
      />

      {/* TABLA */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {customers.length === 0 ? (
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
            <Box>
              {/* <TableContainer component={Paper} variant="outlined"> */}
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
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <TableCell>{customer.identification}</TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || "-"}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* </TableContainer> */}
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </PageContainer>
  );
}
