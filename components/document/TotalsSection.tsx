"use client";
import {
  Box,
  TextField,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Grid,
} from "@mui/material";
import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { useFormContext } from "react-hook-form";

export default function InvoiceTotalsSection() {
  const { control, watch, setValue } = useFormContext();

  const items = watch("items") || [];

  const subtotal15 = items
    .filter((item: any) => item.tax === "IVA_15")
    .reduce((sum: number, item: any) => sum + item.subtotal, 0);

  const subtotal5 = items
    .filter((item: any) => item.tax === "IVA_5")
    .reduce((sum: number, item: any) => sum + item.subtotal, 0);

  const subtotal0 = items
    .filter((item: any) => item.tax === "IVA_0")
    .reduce((sum: number, item: any) => sum + item.subtotal, 0);

  const discount = items.reduce(
    (sum: number, item: any) => sum + item.discountAmount,
    0
  );

  const iva15 = subtotal15 * 0.15;
  const iva5 = subtotal5 * 0.05;
  const ice = items
    .filter((item: any) => item.tax === "ICE")
    .reduce((sum: number, item: any) => sum + item.taxAmount, 0);

  const total =
    subtotal15 + subtotal5 + subtotal0 + iva15 + iva5 + ice - discount;

  useEffect(() => {
    setValue("total", total);
  }, [total, setValue]);

  return (
    <Box mt={3}>
      <Grid container mb={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Descripción"
                size="small"
                fullWidth
                value={field.value || ""}
                multiline
                rows={4}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Subtotal 15%</TableCell>
                  <TableCell align="right">{subtotal15.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Subtotal 5%</TableCell>
                  <TableCell align="right">{subtotal5.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Subtotal 0%</TableCell>
                  <TableCell align="right">{subtotal0.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Descuento</TableCell>
                  <TableCell align="right">{discount.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Iva (15%)</TableCell>
                  <TableCell align="right">{iva15.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Iva (5%)</TableCell>
                  <TableCell align="right">{iva5.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>ICE</TableCell>
                  <TableCell align="right">{ice.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{total.toFixed(2)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
