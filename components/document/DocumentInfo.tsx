"use client";
import { useState } from "react";
import {
  Box,
  TextField,
  Stack,
  IconButton,
  Autocomplete,
  MenuItem,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { UserPlus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { PersonInput } from "@/lib/validations/person";
import { DocumentFiscalInfo } from "./DocumentFiscalInfo";

interface DocumentInfoProps {
  modeEdit: boolean;
  persons: PersonInput[];
}

export default function DocumentInfo({ persons, modeEdit }: DocumentInfoProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext(); // <- accedemos al contexto del formulario

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Controller
        name="issueDate"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Fecha de Emisión"
            type="date"
            size="small"
            fullWidth
            value={
              field.value
                ? new Date(field.value).toISOString().substring(0, 10)
                : ""
            }
            onChange={(e) => {
              field.onChange(new Date(e.target.value));
            }}
            error={!!errors.issueDate}
            helperText={errors.issueDate?.message?.toString() || ""}
            disabled={modeEdit}
          />
        )}
      />
      <Controller
        name="entityType"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Tipo"
            size="small"
            fullWidth
            error={!!errors.entityType}
            helperText={errors.entityType?.message?.toString() || ""}
            disabled={modeEdit}
            value={field.value || ""}
            onChange={field.onChange}
            select
          >
            <MenuItem value="CUSTOMER">Cliente</MenuItem>
            <MenuItem value="SUPPLIER">Proveedor</MenuItem>
          </TextField>
        )}
      />
      <Controller
        name="documentType"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Tipo de Documento"
            size="small"
            fullWidth
            error={!!errors.documentType}
            helperText={errors.documentType?.message?.toString() || ""}
            disabled={modeEdit}
            value={field.value || ""}
            onChange={(e) => {
              field.onChange(e.target.value);
            }}
            select
          >
            <MenuItem value="INVOICE">Factura</MenuItem>
            <MenuItem value="CREDIT_NOTE">Nota de Crédito</MenuItem>
            <MenuItem value="DEBIT_NOTE">Nota de Débito</MenuItem>
          </TextField>
        )}
      />
      <Stack direction="row" spacing={1} alignItems="center">
        <Controller
          name="personId"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Autocomplete
              options={persons}
              getOptionLabel={(option) =>
                `[${option.identification}] - ${option.firstName} ${option.lastName}`
              }
              value={persons.find((c: any) => c.id === value) || null}
              onChange={(_, newValue) => {
                onChange(newValue?.id || "");
              }}
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Persona"
                  size="small"
                  fullWidth
                  error={!!errors.personId}
                  helperText={errors.personId?.message?.toString() || ""}
                />
              )}
            />
          )}
        />

        <IconButton color="primary">
          <UserPlus size={20} />
        </IconButton>
      </Stack>

      <DocumentFiscalInfo
        modeEdit={modeEdit}
        // documentType={watch("documentType") || "INVOICE"}
        documentType={"INVOICE"}
      />
    </Box>
  );
}
