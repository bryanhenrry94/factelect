"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Delete, Plus } from "lucide-react";

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

import { sriPaymentMethods } from "@/constants/sri";

export const PaymentMethodsTable = () => {
  const { control, setValue, watch } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "documentPayments",
  });

  const items = watch("items") || [];
  const total = items.reduce((sum: number, item: any) => sum + item.total, 0);

  // Auto set total on first payment
  useEffect(() => {
    const payments = watch("documentPayments") || [];
    if (payments.length > 0) {
      setValue(`documentPayments.0.amount`, total);
    }
  }, [total, setValue, watch]);

  return (
    <div className="mt-2 space-y-3">
      <div className="overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Forma de pago</TableHead>
              <TableHead className="text-center">Plazo</TableHead>
              <TableHead className="text-center">Unidad</TableHead>
              <TableHead className="text-center">Valor</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                {/* PAYMENT METHOD */}
                <TableCell className="min-w-[260px]">
                  <Controller
                    control={control}
                    name={`documentPayments.${index}.paymentMethod`}
                    render={({ field }) => (
                      <Select
                        value={field.value || "20"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                        <SelectContent>
                          {sriPaymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </TableCell>

                {/* TERM */}
                <TableCell className="text-center w-[120px]">
                  <Controller
                    control={control}
                    name={`documentPayments.${index}.term`}
                    render={({ field }) => (
                      <Input
                        type="number"
                        className="text-right"
                        value={field.value ?? 0}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </TableCell>

                {/* TERM UNIT */}
                <TableCell className="w-[140px]">
                  <Controller
                    control={control}
                    name={`documentPayments.${index}.termUnit`}
                    render={({ field }) => (
                      <Select
                        value={field.value || "días"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="días">Días</SelectItem>
                          <SelectItem value="meses">Meses</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </TableCell>

                {/* AMOUNT */}
                <TableCell className="text-right w-[140px]">
                  <Controller
                    control={control}
                    name={`documentPayments.${index}.amount`}
                    render={({ field }) => (
                      <Input
                        type="number"
                        className="text-right"
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={() => {
                          const numeric = parseFloat(
                            field.value ? field.value.toString() : "0"
                          );
                          field.onChange(
                            isNaN(numeric) ? 0 : Number(numeric.toFixed(2))
                          );
                        }}
                      />
                    )}
                  />
                </TableCell>

                {/* DELETE */}
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Delete className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ADD PAYMENT */}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            paymentMethod: "20",
            term: 0,
            termUnit: "días",
            amount: total,
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar forma de pago
      </Button>
    </div>
  );
};
