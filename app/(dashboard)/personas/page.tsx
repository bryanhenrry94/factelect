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
  Grid,
  TablePagination,
} from "@mui/material";
import { Edit, Delete, Users, Plus, UserCheck, Truck } from "lucide-react";
import { useSession } from "next-auth/react";

import { deletePerson, getPersonsByTenant } from "@/app/actions/person";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { PersonInput } from "@/lib/validations/person";
import PersonFormDialog from "@/components/person/person-form-dialog";
import { getRoleLabel } from "@/utils/person";
import FilterCard from "@/components/ui/FilterCard";
import { useRouter, useSearchParams } from "next/navigation";
import { notifyInfo } from "@/lib/notifications";

export default function PersonsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const tipoValue = params.get("tipo") ?? "todos";

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search); // actualiza el valor definitivo
    }, 300);

    return () => clearTimeout(handler); // limpia si sigue escribiendo
  }, [search]);

  useEffect(() => {
    updateParam("search", debouncedSearch);
  }, [debouncedSearch]);

  // 🔹 Función para actualizar un parámetro sin borrar los otros
  const updateParam = (key: string, value: string) => {
    const query = new URLSearchParams(params.toString());
    query.set(key, value);
    router.push(`/personas?${query.toString()}`);
  };

  const [stats, setStats] = useState({ total: 0, clientes: 0, proveedores: 0 });

  useEffect(() => {
    // Simular carga de estadísticas
    const loadStats = async () => {
      if (!session?.user?.tenantId) return;

      const allPersons = await getPersonsByTenant({
        tenantId: session.user.tenantId,
      });

      if (allPersons.success) {
        const total = allPersons.data.length;
        const clientes = allPersons.data.filter((p) =>
          p.roles.includes("CLIENT")
        ).length;
        const proveedores = allPersons.data.filter((p) =>
          p.roles.includes("SUPPLIER")
        ).length;

        setStats({ total, clientes, proveedores });
      }
    };

    loadStats();
  }, [persons, session?.user?.tenantId]);

  const loadPersons = useCallback(async () => {
    if (!session?.user?.tenantId) return;

    // asignación correcta del rol según filtro
    let role: "CLIENT" | "SUPPLIER" | undefined = undefined;

    if (tipoValue === "cliente") role = "CLIENT";
    if (tipoValue === "proveedor") role = "SUPPLIER";

    console.log("Cargando personas");
    const response = await getPersonsByTenant({
      tenantId: session.user.tenantId,
      role, // solamente enviamos si existe
      search: debouncedSearch,
    });

    if (response.success) {
      setPersons(response.data);
    }
  }, [session?.user?.tenantId, tipoValue, debouncedSearch]);

  // Recargar tabla cuando cambie tipo o search
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
        await deletePerson(personId);
        await notifyInfo("Persona eliminada correctamente");
        await loadPersons();
      }
    });
  };

  return (
    <PageContainer title="Personas" description="Administra tus contactos">
      <PageHeader title="Personas" />

      {/* BUSCADOR */}
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
          onChange={(e) => {
            setSearch(e.target.value);
            updateParam("search", e.target.value);
          }}
        />

        <Button variant="contained" startIcon={<Plus />} onClick={handleAdd}>
          Agregar Persona
        </Button>
      </Box>

      {/* FILTROS */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 4, md: 4 }}>
            <FilterCard
              title="Total Personas"
              count={stats.total}
              icon={Users}
              color="blue"
              onClick={() => updateParam("tipo", "todos")}
            />
          </Grid>

          <Grid size={{ xs: 4, md: 4 }}>
            <FilterCard
              title="Clientes"
              count={stats.clientes}
              icon={UserCheck}
              color="sky"
              onClick={() => updateParam("tipo", "cliente")}
            />
          </Grid>

          <Grid size={{ xs: 4, md: 4 }}>
            <FilterCard
              title="Proveedores"
              count={stats.proveedores}
              icon={Truck}
              color="yellow"
              onClick={() => updateParam("tipo", "proveedor")}
            />
          </Grid>
        </Grid>
      </Box>

      {/* DIALOGO */}
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Identificación</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nombre / Razón Social</strong>
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
                  {persons
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((person) => (
                      <TableRow key={person.id} hover>
                        <TableCell>{person.identification}</TableCell>
                        <TableCell>
                          {person.personKind === "NATURAL"
                            ? `${person.firstName} ${person.lastName}`
                            : person.businessName}
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

              <TablePagination
                component="div"
                color="primary"
                count={persons.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5]}
              />
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
