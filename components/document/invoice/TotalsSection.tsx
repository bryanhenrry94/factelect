"use client";

import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function InvoiceTotalsSection() {
  const { control, watch, setValue } = useFormContext();

  const items = watch("items") || [];

  // -------------------------
  // CALCULATIONS
  // -------------------------
  const subtotal15 = items
    .filter((item: any) => item.tax === "IVA_15")
    .reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

  const subtotal5 = items
    .filter((item: any) => item.tax === "IVA_5")
    .reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

  const subtotal0 = items
    .filter((item: any) => item.tax === "IVA_0")
    .reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

  const discount = items.reduce(
    (sum: number, item: any) => sum + (item.discountAmount || 0),
    0
  );

  const iva15 = subtotal15 * 0.15;
  const iva5 = subtotal5 * 0.05;

  const ice = items
    .filter((item: any) => item.tax === "ICE")
    .reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);

  const total =
    subtotal15 + subtotal5 + subtotal0 + iva15 + iva5 + ice - discount;

  // console.log("items", items);
  // console.log("total", total);

  // -------------------------
  // SYNC TOTAL TO FORM
  // -------------------------
  useEffect(() => {
    setValue("subtotal", subtotal15 + subtotal5 + subtotal0);
    setValue("taxTotal", iva15 + iva5 + ice);
    setValue("total", total);
  }, [total, setValue]);

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* DESCRIPTION */}
      <div className="md:col-span-2">
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder="Descripción"
              rows={5}
              value={field.value || ""}
            />
          )}
        />
      </div>

      {/* TOTALS */}
      <Card>
        <CardContent className="p-4">
          {"Totales" + watch("total")}
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Subtotal 15%</TableCell>
                <TableCell className="text-right">
                  {subtotal15.toFixed(2)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Subtotal 5%</TableCell>
                <TableCell className="text-right">
                  {subtotal5.toFixed(2)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Subtotal 0%</TableCell>
                <TableCell className="text-right">
                  {subtotal0.toFixed(2)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>Descuento</TableCell>
                <TableCell className="text-right">
                  {discount.toFixed(2)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>IVA 15%</TableCell>
                <TableCell className="text-right">{iva15.toFixed(2)}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell>IVA 5%</TableCell>
                <TableCell className="text-right">{iva5.toFixed(2)}</TableCell>
              </TableRow>

              <TableRow>
                <TableCell>ICE</TableCell>
                <TableCell className="text-right">{ice.toFixed(2)}</TableCell>
              </TableRow>

              <TableRow className="font-semibold border-t">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{total.toFixed(2)}</TableCell>
              </TableRow>

              <TableRow className="font-normal border-t">
                <TableCell>Saldo</TableCell>
                <TableCell className="text-right">
                  {watch("balance") && watch("balance").toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
