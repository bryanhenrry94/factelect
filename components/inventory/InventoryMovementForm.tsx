"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Delete, Plus } from "lucide-react";

import {
  CreateInventoryMovement,
  createInventoryMovementSchema,
} from "@/lib/validations/inventory/inventory-movement";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { Product } from "@/lib/validations";
import { Unit } from "@/lib/validations/unit";

import {
  createInventoryMovement,
  getInventoryMovementById,
  updateInventoryMovement,
} from "@/actions/inventory/inventory-movement";
import { getWarehouses } from "@/actions/inventory/warehouse";
import { getAllProducts } from "@/actions";
import { getUnits } from "@/actions/unit";
import { getStockByProductAndWarehouse } from "@/actions/inventory/stock";

import { notifyError, notifyInfo } from "@/lib/notifications";
import { formatCurrency } from "@/utils/formatters";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialValues: CreateInventoryMovement = {
  type: "IN",
  date: new Date(),
  warehouseId: "",
  description: "",
  items: [
    {
      productId: "",
      quantity: 0,
      unitId: "",
      cost: 0,
      totalCost: 0,
    },
  ],
};

interface InventoryMovementFormProps {
  inventoryMovementId?: string;
}

export function InventoryMovementForm({
  inventoryMovementId,
}: InventoryMovementFormProps) {
  const { data: session } = useSession();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<CreateInventoryMovement>({
    resolver: zodResolver(createInventoryMovementSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  /* ===================== DATA ===================== */

  useEffect(() => {
    if (!session?.user.tenantId) return;

    getWarehouses(session.user.tenantId).then(
      (r) => r.success && setWarehouses(r.data)
    );

    getAllProducts(session.user.tenantId, "", "PRODUCT").then(
      (r) => r.success && setProducts(r.data)
    );

    getUnits(session.user.tenantId).then((r) => r.success && setUnits(r.data));
  }, [session?.user.tenantId]);

  useEffect(() => {
    if (!inventoryMovementId) return;

    getInventoryMovementById(inventoryMovementId).then((r) => {
      if (!r.success || !r.data) return;

      reset({
        type: r.data.type,
        date: r.data.date,
        warehouseId: r.data.warehouseId,
        description: r.data.description ?? "",
        items: r.data.items,
      });
    });
  }, [inventoryMovementId, reset]);

  /* ===================== LOGIC ===================== */

  const watchedItems = watch("items");

  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const total = (item.quantity || 0) * (item.cost || 0);
      if (item.totalCost !== total) {
        setValue(`items.${index}.totalCost`, total);
      }
    });
  }, [watchedItems, setValue]);

  const handleProductChange = async (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    let cost = 0;

    if (watch("type") === "OUT") {
      const stock = await getStockByProductAndWarehouse(
        productId,
        watch("warehouseId")
      );
      cost = stock.data?.avgCost || 0;
    }

    setValue(`items.${index}.unitId`, product.unitId);
    setValue(`items.${index}.cost`, cost);
  };

  /* ===================== SUBMIT ===================== */

  const onSubmit = async (data: CreateInventoryMovement) => {
    if (!session?.user.tenantId) {
      notifyError("Tenant no encontrado");
      return;
    }

    const response = inventoryMovementId
      ? await updateInventoryMovement(inventoryMovementId, data)
      : await createInventoryMovement(session.user.tenantId, data);

    if (response.success) {
      notifyInfo(
        `Movimiento ${
          inventoryMovementId ? "actualizado" : "creado"
        } correctamente`
      );
      if (!inventoryMovementId) reset(initialValues);
    } else {
      notifyError(response.error || "Error al guardar");
    }
  };

  /* ===================== UI ===================== */

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* CABECERA */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Movimiento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                value={field.value?.toISOString().split("T")[0]}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de movimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Entrada</SelectItem>
                  <SelectItem value="OUT">Salida</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="ADJUST">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Bodega" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea placeholder="Descripción" {...field} />
            )}
          />
        </CardContent>
      </Card>

      {/* ITEMS */}
      <Card>
        <CardHeader>
          <CardTitle>Ítems del Movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Total</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Controller
                      name={`items.${index}.productId`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            handleProductChange(index, v);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.code} - {p.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      )}
                    />
                  </TableCell>

                  <TableCell>
                    {units.find((u) => u.id === watch(`items.${index}.unitId`))
                      ?.name || "-"}
                  </TableCell>

                  <TableCell>
                    {watch("type") === "OUT" ? (
                      formatCurrency(watch(`items.${index}.cost`) || 0)
                    ) : (
                      <Controller
                        name={`items.${index}.cost`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        )}
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    {formatCurrency(watch(`items.${index}.totalCost`) || 0)}
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Delete className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() =>
              append({
                productId: "",
                quantity: 0,
                unitId: "",
                cost: 0,
                totalCost: 0,
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar ítem
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Movimiento"}
        </Button>
      </div>
    </form>
  );
}
