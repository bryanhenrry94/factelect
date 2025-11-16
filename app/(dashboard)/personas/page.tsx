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

import { deletePerson, getPersonsByTenant } from "@/app/actions/person";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { PersonFilter } from "@/types";
import { PersonInput } from "@/lib/validations/person";
import PersonFormDialog from "@/components/person/person-form-dialog";
import { getRoleLabel } from "@/utils/person";

export default function PersonsPage() {
  const { data: session } = useSession();

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPersons = useCallback(async () => {
    if (!session?.user?.tenantId) return;

    const filter: PersonFilter = {
      tenantId: session.user.tenantId,
      role: "CLIENT",
    };

    const response = await getPersonsByTenant(filter);
    if (response.success) setPersons(response.data);
  }, [session?.user?.tenantId]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  const handleAdd = () => {
    setEditingPerson(null);
    setDialogOpen(true);
  };

  const handleEdit = (person: PersonInput) => {
    setEditingPerson(person);
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingPerson(null);
  };

  const handleDelete = (personId: string) => {
    AlertService.showConfirm(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar la persona seleccionada? Esta acción no se puede deshacer.",
      "Eliminar",
      "Cancelar"
    ).then(async (confirmed) => {
      if (confirmed) {
        // Lógica para eliminar la persona
        await deletePerson(personId);
        AlertService.showSuccess("Persona eliminada exitosamente.");
        await loadPersons();
      }
    });
  };

  return (
    <PageContainer
      title="Personas"
      description="Administra las relaciones de tus contactos"
    >
      {/* HEADER */}
      <PageHeader title="Personas" />

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField label="Buscar personas" variant="outlined" size="small" />
        <Button variant="contained" startIcon={<Plus />} onClick={handleAdd}>
          Agregar Persona
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        {/* Aquí puedes agregar componentes de filtro si es necesario */}
        
      </Box>

      {/* DIALOGO FORMULARIO */}
      <PersonFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={loadPersons}
        editingPerson={editingPerson}
        tenantId={session?.user?.tenantId ?? ""}
        setError={setError}
      />

      {/* TABLA */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {persons.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Users />
              <Typography variant="h6" mt={2}>
                No hay personas aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega la primera persona
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
                    <TableCell>
                      <strong>Rol</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {persons.map((person) => (
                    <TableRow
                      key={person.id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <TableCell>{person.identification}</TableCell>
                      <TableCell>{`${person.firstName} ${person.lastName}`}</TableCell>
                      <TableCell>{person.email}</TableCell>
                      <TableCell>{person.phone || "-"}</TableCell>
                      <TableCell>
                        {person.roles.map(getRoleLabel).join(", ")}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(person)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(person.id)}
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
