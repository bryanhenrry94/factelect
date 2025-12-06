"use client";

import { Product } from "@/lib/validations/inventory/product";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Button,
  TableContainer,
} from "@mui/material";
import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import CustomRow from "./CustomRow";

export default function InvoiceItemsTable({
  products,
}: {
  products: Product[];
}) {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <Box>
      <TableContainer
        sx={{
          mt: 2,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          bgcolor: "background.paper",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: "grey.100",
                "& th": {
                  fontWeight: 600,
                  py: 1.5,
                  fontSize: "0.85rem",
                  color: "grey.700",
                },
              }}
            >
              <TableCell>Producto</TableCell>
              <TableCell align="center">Cantidad</TableCell>
              <TableCell align="center">Precio</TableCell>
              <TableCell align="center">Impuesto</TableCell>
              <TableCell align="center">% Desc.</TableCell>
              <TableCell align="center">Descuento</TableCell>
              <TableCell align="center">Subtotal</TableCell>
              <TableCell align="center" />
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => {
              return (
                <CustomRow
                  key={field.id}
                  field={field}
                  index={index}
                  products={products}
                  remove={remove}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        color="primary"
        variant="outlined"
        sx={{ mt: 2 }}
        onClick={() =>
          append({
            productId: "",
            quantity: 1,
            unitPrice: 0,
            tax: "IVA_0",
            taxAmount: 0,
            discountRate: 0,
            discountAmount: 0,
            subtotal: 0,
          })
        }
        startIcon={<Plus size={16} />}
      >
        Agregar detalle
      </Button>
    </Box>
  );
}
