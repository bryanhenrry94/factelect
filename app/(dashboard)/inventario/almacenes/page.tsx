"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

import {
  CreateWarehouse,
  createWarehouseSchema,
  Warehouse,
} from "@/lib/validations/inventory/warehouse";
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouses,
  updateWarehouse,
} from "@/actions/inventory/warehouse";
import { CostCenter } from "@/lib/validations/accounting/cost-center";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { getCostCenters } from "@/actions/accounting/cost-center";

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
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { ChartOfAccount } from "@/lib/validations";
import { Badge } from "@/components/ui/badge";
import { AccountSelect } from "@/components/AccountSelected";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

const initialState: Warehouse = {
  id: "",
  tenantId: "",
  name: "",
  accountInventoryId: null,
  costCenterId: null,
  isActive: true,
};

export default function BodegasPage() {
  const { data: session } = useSession();
  const { search, setSearch } = useSearchFilter();

  const [open, setOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseToEdit, setWarehouseToEdit] = useState<Warehouse | null>(
    null
  );
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  // Pagination
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* =======================
     FORM
  ======================= */
  const form = useForm<CreateWarehouse>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: initialState,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  /* =======================
     FETCH WAREHOUSES
  ======================= */
  const fetchWarehouses = async () => {
    if (!session?.user?.tenantId) return;

    try {
      const response = await getWarehouses(session.user.tenantId, search);
      if (!response.success) {
        notifyError("Error al cargar las bodegas");
        return;
      }
      setWarehouses(response.data || []);
    } catch {
      notifyError("Error al cargar las bodegas");
    }
  };

  useEffect(() => {
    fetchWarehouses();
    fetchAccounts();
  }, [session?.user?.tenantId, search]);

  /* =======================
     FETCH COST CENTERS
  ======================= */
  useEffect(() => {
    const fetchCostCenters = async () => {
      if (!session?.user?.tenantId) return;

      try {
        const response = await getCostCenters(session.user.tenantId);
        if (!response.success) {
          notifyError("Error al cargar los centros de costo");
          return;
        }
        setCostCenters(response.data || []);
      } catch {
        notifyError("Error al cargar los centros de costo");
      }
    };

    fetchCostCenters();
  }, [session?.user?.tenantId]);

  const fetchAccounts = async () => {
    if (!session?.user?.tenantId) return;
    const res = await getAccounts(session.user.tenantId);
    if (!res.success) return notifyError("Error al cargar cuentas contables");
    setAccounts(res.data || []);
  };

  /* =======================
     ACTIONS
  ======================= */
  const handleCreate = () => {
    reset(initialState);
    setWarehouseToEdit(null);
    setOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setWarehouseToEdit(warehouse);
    reset({
      name: warehouse.name,
      accountInventoryId: warehouse.accountInventoryId,
      costCenterId: warehouse.costCenterId,
      isActive: warehouse.isActive,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    const confirm = await ConfirmDialog.confirm(
      "Aviso",
      "¿Deseas eliminar el almacén?"
    );
    if (!confirm) return;

    const result = await deleteWarehouse(id);
    if (result.success) {
      notifyInfo("Almacén eliminado correctamente");
      fetchWarehouses();
    } else {
      notifyError("Error al eliminar el almacén");
    }
  };

  const onSubmit = async (data: CreateWarehouse) => {
    if (!session?.user?.tenantId) {
      notifyError("No se encontró el tenantId del usuario");
      return;
    }

    const response = warehouseToEdit
      ? await updateWarehouse(warehouseToEdit.id, data)
      : await createWarehouse(session.user.tenantId, data);

    if (response.success) {
      notifyInfo(
        `Almacén ${warehouseToEdit ? "actualizado" : "creado"} correctamente`
      );
      fetchWarehouses();
      setOpen(false);
      setWarehouseToEdit(null);
    } else {
      notifyError(
        `Error al ${warehouseToEdit ? "actualizar" : "crear"} el almacén`
      );
    }
  };

  /* =======================
     RENDER
  ======================= */
  return (
    <PageContainer
      title="Almacenes"
      description="Gestiona los almacenes de tu organización"
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar almacén..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Almacenes</CardTitle>
          <CardDescription>
            Lista de almacenes disponibles en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="mx-auto mb-2" />
              No hay almacenes registrados.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cuenta Contable Inventario</TableHead>
                    <TableHead>Centro de Costo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((warehouse) => (
                      <TableRow key={warehouse.id}>
                        <TableCell>{warehouse.name}</TableCell>
                        <TableCell>
                          {accounts.find(
                            (acc) => acc.id === warehouse.accountInventoryId
                          )?.name || "—"}
                        </TableCell>
                        <TableCell>
                          {costCenters.find(
                            (cc) => cc.id === warehouse.costCenterId
                          )?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              warehouse.isActive ? "default" : "secondary"
                            }
                          >
                            {warehouse.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEdit(warehouse)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(warehouse.id)}
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
                totalItems={warehouses.length}
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
              {warehouseToEdit ? "Editar Almacén" : "Agregar Almacén"}
            </DialogTitle>
            <DialogDescription>
              {warehouseToEdit
                ? "Modifica los datos del almacén"
                : "Completa el formulario para agregar un nuevo almacén"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nombre */}
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del almacén" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Cuenta contable inventario */}
              <FormField
                control={control}
                name="accountInventoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuenta de inventario</FormLabel>
                    <FormControl>
                      <AccountSelect
                        label="Cuenta de inventario"
                        accounts={accounts}
                        value={field.value ?? null}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Centro de costo */}
              <FormField
                control={control}
                name="costCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro de costo</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(v) =>
                          field.onChange(v === "none" ? null : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Centro de costo (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Sin centro de costo
                          </SelectItem>
                          {costCenters.map((cc) => (
                            <SelectItem key={cc.id} value={cc.id}>
                              {cc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado */}
              <FormField
                control={control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activo</FormLabel>
                    <FormControl className="flex items-center space-x-2">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
