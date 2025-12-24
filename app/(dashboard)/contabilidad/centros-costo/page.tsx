"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";

import {
  CostCenter,
  CreateCostCenterInput,
  createCostCenterSchema,
} from "@/lib/validations/accounting/cost-center";

import {
  createCostCenter,
  deleteCostCenter,
  getCostCenters,
  updateCostCenter,
} from "@/actions/accounting/cost-center";

/* ShadCN */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const initialState: CostCenter = {
  id: "",
  tenantId: "",
  code: "",
  name: "",
  isActive: true,
};

export default function CentrosCostoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [selected, setSelected] = useState<CostCenter | null>(null);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ---------------- Debounce ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- URL params ---------------- */
  useEffect(() => {
    const query = new URLSearchParams(params.toString());
    debouncedSearch
      ? query.set("search", debouncedSearch)
      : query.delete("search");
    router.push(`/contabilidad/centros-costo?${query.toString()}`);
  }, [debouncedSearch]);

  /* ---------------- Fetch ---------------- */
  const fetchCostCenters = async () => {
    if (!session?.user?.tenantId) return;

    const response = await getCostCenters(
      session.user.tenantId,
      debouncedSearch
    );

    if (!response.success) {
      notifyError("Error al cargar los centros de costo");
      return;
    }

    setCostCenters(response.data || []);
  };

  useEffect(() => {
    fetchCostCenters();
  }, [session?.user?.tenantId, debouncedSearch]);

  /* ---------------- Form ---------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCostCenterInput>({
    resolver: zodResolver(createCostCenterSchema),
    defaultValues: initialState,
  });

  const openCreate = () => {
    reset(initialState);
    setSelected(null);
    setOpen(true);
  };

  const openEdit = (cc: CostCenter) => {
    setSelected(cc);
    reset({ code: cc.code, name: cc.name });
    setOpen(true);
  };

  const onSubmit = async (data: CreateCostCenterInput) => {
    if (!session?.user?.tenantId) return;

    const response = selected
      ? await updateCostCenter(selected.id, data)
      : await createCostCenter(session.user.tenantId, data);

    if (!response.success) {
      notifyError(
        `Error al ${selected ? "actualizar" : "crear"} el centro de costo`
      );
      return;
    }

    notifyInfo(
      `Centro de costo ${selected ? "actualizado" : "creado"} correctamente`
    );

    fetchCostCenters();
    setOpen(false);
    setSelected(null);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await ConfirmDialog.confirm(
      "Aviso",
      "¿Deseas eliminar el centro de costo?"
    );
    if (!confirmed) return;

    const response = await deleteCostCenter(id);
    if (response.success) {
      notifyInfo("Centro de costo eliminado correctamente");
      fetchCostCenters();
    } else {
      notifyError("Error al eliminar el centro de costo");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <PageContainer
      title="Centros de Costo"
      description="Gestiona los centros de costo de tu organización"
    >
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between mb-4">
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <Card>
        <CardContent>
          {costCenters.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No hay centros de costo
              </h3>
              <p className="text-sm text-muted-foreground">
                Agrega el primero para comenzar
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costCenters
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((cc) => (
                      <TableRow key={cc.id}>
                        <TableCell>{cc.code}</TableCell>
                        <TableCell>{cc.name}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <button
                            className="p-1 hover:bg-muted rounded"
                            onClick={() => openEdit(cc)}
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            className="p-1 hover:bg-destructive/20 rounded"
                            onClick={() => handleDelete(cc.id)}
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
                totalItems={costCenters.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected ? "Editar Centro de Costo" : "Nuevo Centro de Costo"}
            </DialogTitle>
            <DialogDescription>
              Complete los datos del centro de costo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Código</Label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
              {errors.code && (
                <p className="text-xs text-red-500">{errors.code.message}</p>
              )}
            </div>

            <div>
              <Label>Nombre</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
