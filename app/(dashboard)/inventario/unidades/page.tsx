"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { Unit, CreateUnit, CreateUnitSchema } from "@/lib/validations/unit";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { createUnit, deleteUnit, getUnits, updateUnit } from "@/actions/unit";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const ROWS_PER_PAGE = 5;

const UnitsPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitSelected, setUnitSelected] = useState<Unit | null>(null);

  const { search, setSearch } = useSearchFilter();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  /* =======================
     FORM
  ======================= */
  const { control, handleSubmit, reset } = useForm<CreateUnit>({
    resolver: zodResolver(CreateUnitSchema),
    defaultValues: {
      name: "",
      symbol: "",
    },
  });

  /* =======================
     FETCH
  ======================= */
  const fetchUnits = async () => {
    if (!session?.user?.tenantId) return;

    try {
      const response = await getUnits(session.user.tenantId, search);
      if (!response.success) {
        notifyError("Error al cargar las unidades");
        return;
      }
      setUnits(response.data || []);
    } catch {
      notifyError("Error al cargar las unidades");
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [session?.user?.tenantId, search]);

  /* =======================
     ACTIONS
  ======================= */
  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    reset({ name: "", symbol: "" });
    setUnitSelected(null);
    setOpen(false);
  };

  const handleEdit = (unit: Unit) => {
    setUnitSelected(unit);
    reset({
      name: unit.name ?? "",
      symbol: unit.symbol ?? "",
    });
    handleOpen();
  };

  const handleDelete = async (id: string) => {
    const confirm = await ConfirmDialog.confirm(
      "Aviso",
      "¿Deseas eliminar la unidad?"
    );
    if (!confirm) return;

    const result = await deleteUnit(id);
    if (result.success) {
      notifyInfo("Unidad eliminada correctamente");
      fetchUnits();
    } else {
      notifyError("Error al eliminar la unidad");
    }
  };

  const onSubmit = async (data: CreateUnit) => {
    if (!session?.user?.tenantId) {
      notifyError("No se encontró el tenantId del usuario");
      return;
    }

    const response = unitSelected
      ? await updateUnit(unitSelected.id, data)
      : await createUnit(session.user.tenantId, data);

    if (response) {
      notifyInfo(
        `Unidad ${unitSelected ? "actualizada" : "creada"} correctamente`
      );
      fetchUnits();
      handleClose();
    } else {
      notifyError(
        `Error al ${unitSelected ? "actualizar" : "crear"} la unidad`
      );
    }
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <PageContainer
      title="Unidades de Medida"
      description="Gestiona las unidades de medida de tus productos y servicios"
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar unidades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Button onClick={handleOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unidades</CardTitle>
          <CardDescription>
            Lista de unidades de medida disponibles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="mx-auto mb-2" />
              No hay unidades registradas.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Abreviatura</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((unit: Unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>{unit.name}</TableCell>
                        <TableCell>{unit.symbol}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEdit(unit)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(unit.id)}
                          >
                            <Delete className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={units.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {unitSelected ? "Editar Unidad" : "Agregar Unidad"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Nombre de la unidad" required />
              )}
            />

            <Controller
              name="symbol"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Abreviatura" required />
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default UnitsPage;
