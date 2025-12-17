"use client";

import React, { memo, useEffect, useState } from "react";
import { Delete, Search } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { useSession } from "next-auth/react";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/formatters";
import { DocumentResponse, TransactionInput } from "@/lib/validations";
import { getDocument, getDocuments } from "@/actions";

interface CustomRowProps {
  field: any;
  index: number;
  remove: (index: number) => void;
}

const CustomRow: React.FC<CustomRowProps> = memo(({ field, index, remove }) => {
  const { data: session } = useSession();

  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext<TransactionInput>();

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [document, setDocument] = useState<DocumentResponse | null>(null);

  const handleChangeDocument = async (documentId: string) => {
    const response = await getDocument(documentId);
    if (response.success && response.data) {
      setDocument(response.data);
    }
  };

  const personId = watch("personId");

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const fetchDocuments = async () => {
      try {
        const response = await getDocuments(session.user.tenantId, personId);

        if (!response.success || !response.data) {
          setDocuments([]);
          return;
        }

        setDocuments(response.data);
      } catch (error) {
        console.error("Error loading documents", error);
        setDocuments([]);
      }
    };

    fetchDocuments();
  }, [session?.user?.tenantId, personId]);

  return (
    <TableRow className="border-b">
      {/* Documento */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name={`documents.${index}.documentId`}
            render={({ field }) => (
              <Select
                value={field.value || ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  handleChangeDocument(value);
                }}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Seleccione documento" />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {`FACT ${
                        doc.DocumentFiscalInfo?.sequence
                      } - $${doc.total.toFixed(2)} - ${new Date(
                        doc.issueDate
                      ).toLocaleDateString()}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {errors.documents?.[index]?.documentId && (
          <p className="text-xs text-destructive mt-1">
            {errors.documents[index]?.documentId?.message as string}
          </p>
        )}
      </TableCell>

      {/* Fecha emisión */}
      <TableCell>
        {document ? new Date(document.issueDate).toLocaleDateString() : "-"}
      </TableCell>

      {/* Valor */}
      <TableCell>{document ? `$${document.total.toFixed(2)}` : "-"}</TableCell>

      {/* Saldo */}
      <TableCell>{formatCurrency(document?.balance || 0)}</TableCell>

      {/* Valor a cobrar */}
      <TableCell>
        {document ? (
          <Controller
            control={control}
            name={`documents.${index}.amount`}
            render={({ field }) => (
              <Input
                type="number"
                className="w-[120px]"
                min={0}
                step={0.01}
                value={field.value ?? 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  field.onChange(isNaN(value) ? 0 : value);
                }}
              />
            )}
          />
        ) : (
          <p className="text-sm text-muted-foreground">N/A</p>
        )}
      </TableCell>

      {/* Acción */}
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => remove(index)}
        >
          <Delete className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

CustomRow.displayName = "CustomRow";
export default CustomRow;
