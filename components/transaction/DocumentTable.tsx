"use client";

import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import CustomRow from "./CustomRow";

export default function DocumentTable() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents",
  });

  return (
    <div className="w-full overflow-x-auto">
      {/* Contenedor con scroll vertical */}
      <div className="max-h-[400px] overflow-y-auto overflow-x-auto border rounded-md">
        <Table className="min-w-[650px] table-auto">
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold bg-muted">
                Documento
              </TableHead>
              <TableHead className="font-semibold bg-muted">
                Fecha Emisión
              </TableHead>
              <TableHead className="font-semibold bg-muted">Valor</TableHead>
              <TableHead className="font-semibold bg-muted">Saldo</TableHead>
              <TableHead className="font-semibold bg-muted">
                Valor a Cobrar
              </TableHead>
              <TableHead className="font-semibold bg-muted text-right">
                Acción
              </TableHead>
            </TableRow>
          </TableHeader>

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
      </div>

      <Button
        type="button"
        className="mt-3"
        onClick={() =>
          append({
            transactionId: "",
            documentId: "",
            amount: 0,
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar detalle
      </Button>
    </div>
  );
}
