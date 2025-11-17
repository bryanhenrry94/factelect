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
  Pagination,
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

export default function CustomersPage() {
  const { data: session } = useSession();

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [search, setSearch] = useState("");
  const [filteredPersons, setFilteredPersons] = useState<PersonInput[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const loadPersons = useCallback(async () => {
    if (!session?.user?.tenantId) return;

    const filter: PersonFilter = {
      tenantId: session.user.tenantId,
      role: "CLIENT",
    };

    const response = await getPersonsByTenant(filter);

    if (response.success) {
      setPersons(response.data);
      setFilteredPersons(response.data);
    }
  }, [session?.user?.tenantId]);

  useEffect(() => {
    loadPersons();
  }, [loadPersons]);

  // Real-time search filter
  useEffect(() => {
    const lower = search.toLowerCase().trim();

    const results = persons.filter((p) =>
      [p.identification, p.firstName, p.lastName, p.email, p.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(lower))
    );

    setFilteredPersons(results);
    setPage(1);
  }, [search, persons]);

  const handleAdd = () => {
    setEditingPerson(null); //  LIMPIA EL FORMULARIO
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

  const handleDelete = (customerId: string) => {
    AlertService.showConfirm(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar la persona seleccionada? Esta acción no se puede deshacer.",
      "Eliminar",
      "Cancelar"
    ).then(async (confirmed) => {
      if (confirmed) {
        await deletePerson(customerId);
        AlertService.showSuccess("Persona eliminada exitosamente.");
        await loadPersons();
      }
    });
  };

  const handlePageChange = (_event: any, value: number) => {
    setPage(value);
  };

  // CALCULAR REGISTROS MOSTRADOS
  const startIndex = (page - 1) * rowsPerPage;
  const visibleRows = filteredPersons.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  return (
    <PageContainer
      title="Personas"
      description="Administra las relaciones de tus contactos"
    >
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
        <TextField
          label="Buscar personas"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button variant="contained" startIcon={<Plus />} onClick={handleAdd}>
          Agregar Persona
        </Button>
      </Box>

      {/* FORMULARIO */}
      <PersonFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSuccess={async (isUpdate) => {
          await loadPersons();
          AlertService.showSuccess(
            isUpdate
              ? "Persona actualizada correctamente."
              : "Persona creada correctamente."
          );
        }}
        editingPerson={editingPerson}
        tenantId={session?.user?.tenantId ?? ""}
        setError={setError}
      />

      {/* TABLA */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {filteredPersons.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Users />
              <Typography variant="h6" mt={2}>
                No hay personas que coincidan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Intenta buscar con otro término
              </Typography>
            </Box>
          ) : (
            <>
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
                  {visibleRows.map((person) => (
                    <TableRow key={person.id} hover>
                      <TableCell>{person.identification}</TableCell>
                      <TableCell>
                        {person.firstName + " " + person.lastName}
                      </TableCell>
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

              {/* PAGINACIÓN */}
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={Math.ceil(filteredPersons.length / rowsPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            </>
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
