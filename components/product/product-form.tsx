"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  CreateProduct,
  createProductSchema,
} from "@/lib/validations/inventory/product";
import { taxOptions } from "@/constants/tax";
import { Category } from "@/lib/validations/inventory/category";
import { Unit } from "@/lib/validations/unit";
import { ChartOfAccount } from "@/lib/validations";

import { getAllCategories } from "@/actions/inventory/category";
import { getUnits } from "@/actions/unit";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { createProduct, getProductById, updateProduct } from "@/actions";

import { notifyError, notifyInfo } from "@/lib/notifications";
import { AccountSelect } from "../AccountSelected";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { useRouter } from "next/navigation";

interface ProductFormProps {
  productId?: string | null;
  onCreate?: (data: CreateProduct) => Promise<void> | void;
}

export function ProductForm({ productId, onCreate }: ProductFormProps) {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId || "";
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateProduct>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      status: "ACTIVE",
      type: "SERVICE",
      code: "",
      description: "",
      price: 0,
      tax: "IVA_0",
      barcode: null,
      categoryId: undefined,
      unitId: undefined,
      salesAccountId: null,
      inventoryAccountId: null,
      costAccountId: null,
    },
  });

  /* ---------------- data ---------------- */
  useEffect(() => {
    if (!tenantId) return;

    getAllCategories(tenantId).then(
      (r) => r.success && setCategories(r.data || [])
    );
    getUnits(tenantId).then((r) => r.success && setUnits(r.data || []));
    getAccounts(tenantId).then((r) => {
      if (!r.success) notifyError("Error cargando cuentas");
      else setAccounts(r.data || []);
    });
  }, [tenantId]);

  /* ---------------- load product ---------------- */
  useEffect(() => {
    if (!productId || accounts.length === 0) return;

    getProductById(productId).then((res) => {
      if (!res.success || !res.data) {
        notifyError("Error cargando producto");
        return;
      }

      reset({
        ...res.data,
        inventoryAccountId: res.data.inventoryAccountId || null,
        costAccountId: res.data.costAccountId || null,
      });
    });
  }, [productId, accounts, reset]);

  const type = watch("type");

  /* ---------------- submit ---------------- */
  const onSubmit = async (data: CreateProduct) => {
    const res = productId
      ? await updateProduct(productId, data)
      : await createProduct(data, tenantId);

    if (!res.success) {
      notifyError(res.error || "Error al guardar");
      return;
    }

    notifyInfo(productId ? "Producto actualizado" : "Producto creado");
    onCreate?.(data);

    if (!productId && res.data) {
      router.replace(`/inventario/productos/${res.data.id}/editar`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {productId ? "Editar Producto" : "Nuevo Producto / Servicio"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <Field>
              <FieldLabel>Estado</FieldLabel>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            {/* Tipo */}
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Producto</SelectItem>
                      <SelectItem value="SERVICE">Servicio</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {/* Código */}
            <Field>
              <FieldLabel>Código</FieldLabel>
              <Controller
                name="code"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Field>

            {type === "PRODUCT" && (
              <Field>
                <FieldLabel>Código de barras</FieldLabel>
                <Controller
                  name="barcode"
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  )}
                />
              </Field>
            )}

            {/* Descripción */}
            <Field className="md:col-span-2">
              <FieldLabel>Descripción</FieldLabel>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Field>

            {/* Precio */}
            <Field>
              <FieldLabel>Precio</FieldLabel>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    value={field.value ?? 0}
                    onChange={(e) => field.onChange(+e.target.value || 0)}
                  />
                )}
              />
            </Field>

            {/* IVA */}
            <Field>
              <FieldLabel>IVA</FieldLabel>
              <Controller
                name="tax"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taxOptions.map((t) => (
                        <SelectItem key={t.code} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {/* Categoría */}
            <Field>
              <FieldLabel>Categoría</FieldLabel>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {/* Unidad */}
            <Field>
              <FieldLabel>Unidad</FieldLabel>
              <Controller
                name="unitId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </FieldGroup>

          <Separator />

          {/* Contabilidad */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Contabilidad
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Cuenta de Ingresos</FieldLabel>
                <Controller
                  name="salesAccountId"
                  control={control}
                  render={({ field }) => (
                    <AccountSelect
                      label="Seleccionar cuenta"
                      accounts={accounts}
                      value={field.value ?? null}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>

              <Field>
                <FieldLabel>Cuenta de Inventario</FieldLabel>
                <Controller
                  name="inventoryAccountId"
                  control={control}
                  render={({ field }) => (
                    <AccountSelect
                      label="Seleccionar cuenta"
                      accounts={accounts}
                      value={field.value ?? null}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>

              <Field>
                <FieldLabel>Cuenta de Costos</FieldLabel>
                <Controller
                  name="costAccountId"
                  control={control}
                  render={({ field }) => (
                    <AccountSelect
                      label="Seleccionar cuenta"
                      accounts={accounts}
                      value={field.value ?? null}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : productId
                ? "Actualizar"
                : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
