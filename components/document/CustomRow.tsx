"use client";

import React, { memo, useEffect } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { taxOptions } from "@/constants/tax";
import { getProductById } from "@/actions";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { Product } from "@/lib/validations";

const taxRates: Record<string, number> = {
  IVA_0: 0,
  IVA_5: 0.05,
  IVA_12: 0.12,
  IVA_14: 0.14,
  IVA_15: 0.15,
  NO_IVA: 0,
  EXENTO_DE_IVA: 0,
};

interface CustomRowProps {
  field: any;
  index: number;
  warehouses: Warehouse[];
  products: Product[];
  remove: (index: number) => void;
}

const CustomRow: React.FC<CustomRowProps> = memo(
  ({ index, warehouses, products, remove }) => {
    const { control, watch, setValue } = useFormContext();

    const handleChangeProduct = async (productId: string) => {
      const res = await getProductById(productId);
      if (res.success && res.data) {
        const product = res.data;
        setValue(`items.${index}.unitPrice`, product.price);
        setValue(`items.${index}.tax`, product.tax);
        setValue(`items.${index}.quantity`, 1);
      }
    };

    const quantity = watch(`items.${index}.quantity`) ?? 0;
    const unitPrice = watch(`items.${index}.unitPrice`) ?? 0;
    const discountRate = watch(`items.${index}.discountRate`) ?? 0;
    const tax = watch(`items.${index}.tax`) || "IVA_0";

    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discountRate) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxRate = taxRates[tax] || 0;
    const totalWithTax =
      subtotalAfterDiscount + subtotalAfterDiscount * taxRate;

    useEffect(() => {
      setValue(`items.${index}.taxAmount`, subtotalAfterDiscount * taxRate);
      setValue(`items.${index}.discountAmount`, discountAmount);
      setValue(`items.${index}.subtotal`, subtotalAfterDiscount);
      setValue(`items.${index}.total`, totalWithTax);
    }, [
      discountAmount,
      subtotalAfterDiscount,
      taxRate,
      totalWithTax,
      index,
      setValue,
    ]);

    return (
      <TableRow>
        {/* Warehouse */}
        <TableCell className="min-w-[160px]">
          <Controller
            control={control}
            name={`items.${index}.warehouseId`}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
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

        {/* Product */}
        <TableCell className="min-w-[230px]">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name={`items.${index}.productId`}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={(val) => {
                    field.onChange(val);
                    handleChangeProduct(val);
                  }}
                >
                  <SelectTrigger>
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
            <Button type="button" size="icon" variant="ghost">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
        </TableCell>

        {/* Quantity */}
        <TableCell className="min-w-[80px]">
          <Controller
            control={control}
            name={`items.${index}.quantity`}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                step="0.01"
                value={field.value ?? 1}
                onChange={(e) =>
                  field.onChange(parseFloat(e.target.value) || 0)
                }
              />
            )}
          />
        </TableCell>

        {/* Unit Price */}
        <TableCell className="min-w-[100px]">
          <Controller
            control={control}
            name={`items.${index}.unitPrice`}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                step="0.01"
                value={field.value ?? 0}
                onChange={(e) =>
                  field.onChange(parseFloat(e.target.value) || 0)
                }
              />
            )}
          />
        </TableCell>

        {/* Tax */}
        <TableCell className="min-w-[95px]">
          <Controller
            control={control}
            name={`items.${index}.tax`}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="IVA" />
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

        {/* Discount */}
        <TableCell className="min-w-[95px]">
          <Controller
            control={control}
            name={`items.${index}.discountRate`}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={field.value ?? 0}
                onChange={(e) =>
                  field.onChange(parseFloat(e.target.value) || 0)
                }
              />
            )}
          />
        </TableCell>

        {/* Discount Amount */}
        <TableCell className="text-right font-semibold min-w-[100px]">
          ${discountAmount.toFixed(2)}
        </TableCell>

        {/* Total */}
        <TableCell className="min-w-[100px]">
          ${totalWithTax.toFixed(2)}
        </TableCell>

        {/* Actions */}
        <TableCell className="text-center min-w-[60px]">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </TableCell>
      </TableRow>
    );
  }
);

CustomRow.displayName = "CustomRow";
export default CustomRow;
