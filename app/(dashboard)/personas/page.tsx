"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  UserCheck,
  Truck,
  Edit,
  Trash2,
  Delete,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { deletePerson, getPersonsByTenant } from "@/actions/person";
import { AlertService } from "@/lib/alerts";
import { notifyInfo } from "@/lib/notifications";
import { getRoleLabel } from "@/utils/person";

import PersonFormDialog from "@/components/person/person-form-dialog";
import FilterCard from "@/components/ui/FilterCard";

// ⭐ SHADCN UI
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PersonInput } from "@/lib/validations/person";

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

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  // Debounce del buscador
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    updateParam("search", debouncedSearch);
  }, [debouncedSearch]);

  const updateParam = (key: string, value: string) => {
    const query = new URLSearchParams(params.toString());
    query.set(key, value);
    router.push(`/personas?${query.toString()}`);
  };

  const [stats, setStats] = useState({ total: 0, clientes: 0, proveedores: 0 });

  useEffect(() => {
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

    let role: "CLIENT" | "SUPPLIER" | "SELLER" | undefined;
    if (tipoValue === "cliente") role = "CLIENT";
    if (tipoValue === "proveedor") role = "SUPPLIER";

    const response = await getPersonsByTenant({
      tenantId: session.user.tenantId,
      role: role ?? "CLIENT",
      search: debouncedSearch,
    });

    if (response.success) setPersons(response.data);
  }, [session?.user?.tenantId, tipoValue, debouncedSearch]);

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
      "¿Estás seguro de que deseas eliminar a esta persona?",
      "Eliminar",
      "Cancelar"
    ).then(async (confirmed) => {
      if (confirmed) {
        await deletePerson(personId);
        await notifyInfo("Persona eliminada");
        await loadPersons();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* BUSCADOR */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Input
          placeholder="Buscar personas..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            updateParam("search", e.target.value);
          }}
          className="max-w-xs"
        />

        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Agregar Persona
        </Button>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-3 gap-4">
        <FilterCard
          title="Total Personas"
          count={stats.total}
          icon={Users}
          color="blue"
          onClick={() => updateParam("tipo", "todos")}
        />
        <FilterCard
          title="Clientes"
          count={stats.clientes}
          icon={UserCheck}
          color="sky"
          onClick={() => updateParam("tipo", "cliente")}
        />
        <FilterCard
          title="Proveedores"
          count={stats.proveedores}
          icon={Truck}
          color="yellow"
          onClick={() => updateParam("tipo", "proveedor")}
        />
      </div>

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
      <Card className="mt-4">
        <CardContent>
          {persons.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto w-10 h-10 text-muted-foreground" />
              <p className="text-lg font-semibold mt-2">No hay personas aún</p>
              <p className="text-sm text-muted-foreground">
                Agrega la primera persona
              </p>
            </div>
          ) : (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificación</TableHead>
                    <TableHead>Nombre / Razón Social</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {persons
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((person) => (
                      <TableRow key={person.id}>
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

                        <TableCell className="text-right space-x-2">
                          <button
                            className="p-1 hover:bg-muted rounded"
                            onClick={() => handleEdit(person)}
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            className="p-1 hover:bg-destructive/20 rounded"
                            onClick={() => handleDelete(person.id)}
                          >
                            <Delete size={18} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {/* PAGINACIÓN SIMPLE (más elegante con shadcn) */}
              <div className="flex justify-end items-center gap-4 mt-3">
                <Button
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => handleChangePage(page - 1)}
                >
                  Anterior
                </Button>

                <span className="text-sm">
                  Página {page + 1} / {Math.ceil(persons.length / rowsPerPage)}
                </span>

                <Button
                  variant="outline"
                  disabled={(page + 1) * rowsPerPage >= persons.length}
                  onClick={() => handleChangePage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
