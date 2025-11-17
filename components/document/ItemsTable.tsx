"use client";

import { Product } from "@/lib/validations/product";
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
      <TableContainer>
        <Table
          sx={{
            minWidth: 650,
            "& .MuiTableCell-root": {
              border: "1px solid rgba(224, 224, 224, 1)",
            },
          }}
          size="small"
          aria-label="a dense table"
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Producto
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Cantidad
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Precio
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Impuesto
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                % Descuento
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Descuento
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Subtotal
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              />
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
        startIcon={<Plus />}
      >
        Agregar detalle
      </Button>
    </Box>
  );
}
