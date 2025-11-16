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

export default function DocumentTable() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents",
  });

  return (
    <Box
      sx={{
        width: "100%",
        overflowX: "auto", // Scroll horizontal si se necesita
      }}
    >
      <TableContainer
        sx={{
          maxHeight: 400,
          overflowY: "auto",
          overflowX: "auto",
          // Para pantallas pequeñas habilitar scroll horizontal
          "@media (max-width: 600px)": {
            overflowX: "auto",
          },
        }}
      >
        <Table
          size="small"
          aria-labelledby="tableTitle"
          sx={{
            minWidth: 650, // Importante para forzar scroll horizontal en móvil
            tableLayout: "auto",
            "& .MuiTableCell-root": {
              border: "1px solid rgba(224, 224, 224, 1)",
              whiteSpace: "nowrap",
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Documento
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Fecha Emisión
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Valor
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Saldo
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Valor a Cobrar
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Acción
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {fields.map((field, index) => (
              <CustomRow
                key={field.id}
                field={field}
                index={index}
                remove={remove}
              />
            ))}
          </TableBody>
        </Table>

        <Button
          color="primary"
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() =>
            append({
              transactionId: "",
              documentId: "",
              amount: 0,
            })
          }
          startIcon={<Plus />}
        >
          Agregar detalle
        </Button>
      </TableContainer>
    </Box>
  );
}
