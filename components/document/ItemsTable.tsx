"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash, PlusCircle } from "lucide-react";

import { Product } from "@/lib/validations/inventory/product";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { getProductById } from "@/actions";
import { taxOptions } from "@/constants/tax";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InvoiceItemsTable({
  warehouses,
  products,
}: {
  warehouses: Warehouse[];
  products: Product[];
}) {
  const { control, watch, setValue } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const handleChangeProduct = async (productId: string, index: number) => {
    if (!productId) return;
    const productResponse = await getProductById(productId);
    if (productResponse.success && productResponse.data) {
      const product = productResponse.data;
      setValue(`items.${index}.unitPrice`, product.price);
      setValue(`items.${index}.tax`, product.tax);
      setValue(`items.${index}.quantity`, 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* {JSON.stringify(watch("items"))} */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[160px]">Bodega</TableHead>
              <TableHead className="w-[260px]">Item</TableHead>
              <TableHead className="w-[90px] text-center">Cantidad</TableHead>
              <TableHead className="w-[110px] text-center">Precio</TableHead>
              <TableHead className="w-[120px] text-center">Impuesto</TableHead>
              <TableHead className="w-[110px] text-center">% Desc.</TableHead>
              <TableHead className="w-[120px] text-right">Descuento</TableHead>
              <TableHead className="w-[120px] text-right">Total</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {fields.map((field, index) => {
              const quantity = watch(`items.${index}.quantity`) ?? 0;
              const unitPrice = watch(`items.${index}.unitPrice`) ?? 0;
              const discountRate = watch(`items.${index}.discountRate`) ?? 0;
              const tax = watch(`items.${index}.tax`) || "IVA_0";

              const taxRate =
                taxOptions.find((o) => o.value === tax)?.rate ?? 0;

              const subtotal = quantity * unitPrice;
              const discountAmount = (subtotal * discountRate) / 100;
              const subtotalAfterDiscount = subtotal - discountAmount;
              const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
              const totalWithTax = subtotalAfterDiscount + taxAmount;

              useEffect(() => {
                setValue(
                  `items.${index}.taxAmount`,
                  subtotalAfterDiscount * taxRate
                );
                setValue(`items.${index}.discountAmount`, discountAmount);
                setValue(`items.${index}.subtotal`, subtotalAfterDiscount);
                setValue(`items.${index}.total`, totalWithTax);
              }, [
                quantity,
                unitPrice,
                discountRate,
                tax,
                subtotalAfterDiscount,
                discountAmount,
                totalWithTax,
                taxRate,
                index,
                setValue,
              ]);

              return (
                <TableRow key={field.id} className="hover:bg-muted/30">
                  {/* Bodega */}
                  <TableCell>
                    <Controller
                      control={control}
                      name={`items.${index}.warehouseId`}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
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
                  </TableCell>

                  {/* Producto */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <Select
                            value={field.value || ""}
                            onValueChange={(v) => {
                              field.onChange(v);
                              handleChangeProduct(v, index);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-primary"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>

                  {/* Cantidad */}
                  <TableCell className="text-center">
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <Input
                          type="number"
                          className="text-center"
                          min={0}
                          step="0.01"
                          value={field.value ?? 1}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || 0)
                          }
                        />
                      )}
                    />
                  </TableCell>

                  {/* Precio */}
                  <TableCell className="text-center">
                    <Controller
                      control={control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <Input
                          type="number"
                          className="text-center"
                          min={0}
                          step="0.01"
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || 0)
                          }
                        />
                      )}
                    />
                  </TableCell>

                  {/* Impuesto */}
                  <TableCell className="text-center">
                    <Controller
                      control={control}
                      name={`items.${index}.tax`}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Impuesto" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxOptions.map(({ label, value, code }) => (
                              <SelectItem key={code} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </TableCell>

                  {/* % Descuento */}
                  <TableCell className="text-center">
                    <Controller
                      control={control}
                      name={`items.${index}.discountRate`}
                      render={({ field }) => (
                        <Input
                          type="number"
                          className="text-center"
                          min={0}
                          max={100}
                          step="0.01"
                          value={field.value ?? 0}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value) || 0)
                          }
                        />
                      )}
                    />
                  </TableCell>

                  {/* Descuento */}
                  <TableCell className="text-right font-medium">
                    ${discountAmount.toFixed(2)}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right font-semibold">
                    ${totalWithTax.toFixed(2)}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            warehouseId: "",
            productId: "",
            quantity: 1,
            unitPrice: 0,
            tax: "IVA_0",
            taxAmount: 0,
            discountRate: 0,
            discountAmount: 0,
            subtotal: 0,
            total: 0,
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" /> Agregar detalle
      </Button>
    </div>
  );
}
