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
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { PersonInput } from "@/lib/validations/person/person";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function PersonsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const [persons, setPersons] = useState<PersonInput[]>([]);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const tipoValue = params.get("tipo") ?? "todos";

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
    router.push("/personas/nuevo");
  };

  const handleEdit = (person: PersonInput) => {
    router.push(`/personas/${person.id}/editar`);
  };

  const handleDelete = async (personId: string) => {
    const ok = await ConfirmDialog.confirm(
      "Eliminar registro",
      "¿Estás seguro de que deseas eliminar este registro?",
      "Eliminar",
      "Cancelar"
    );

    if (!ok) return;

    await deletePerson(personId);
    await notifyInfo("Persona eliminada");
    await loadPersons();
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
          Nuevo
        </Button>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4 sm:flex-row">
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

      {/* TABLA */}
      <Card className="mt-4">
        <CardContent className="p-6">
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
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
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
              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={persons.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
