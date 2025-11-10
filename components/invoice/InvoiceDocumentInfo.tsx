"use client";
import {
  Box,
  TextField,
  MenuItem,
  Stack,
  Typography,
  IconButton,
  Autocomplete,
  Grid,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { UserPlus } from "lucide-react";
import React, { use, useEffect } from "react";
import {
  getEmissionPointsByEstablishment,
  getNextSequenceDocumentNumber,
} from "@/app/actions";
import { EmissionPointWithEstablishmentSchema } from "@/lib/validations/emission-point";
import { useFormContext } from "react-hook-form";

interface InvoiceDocumentInfoProps {
  clients: any[];
  establishments: any[];
  modeEdit: boolean;
}

export default function InvoiceDocumentInfo({
  clients,
  establishments,
  modeEdit,
}: InvoiceDocumentInfoProps) {
  const [emissionPoints, setEmissionPoints] = React.useState<
    EmissionPointWithEstablishmentSchema[]
  >([]);

  const {
    control,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useFormContext(); // <- accedemos al contexto del formulario

  useEffect(() => {
    if (!modeEdit) {
      // Si no estamos en modo edición, limpiamos los puntos de emisión
      setEmissionPoints([]);
      return;
    }

    // Si hay un establishmentId seleccionado, cargamos sus puntos de emisión
    const establishmentId: string = watch("establishmentId");
    console.log("Establishment ID on mount:", establishmentId);
    if (establishmentId) {
      handleChangeEstablishment(establishmentId);
    }
  }, [modeEdit, watch("establishmentId")]); // Solo se ejecuta una vez al montar el componente

  const handleChangeEstablishment = async (value: string) => {
    const response = await getEmissionPointsByEstablishment(value);
    if (response.success) setEmissionPoints(response.data || []);
  };

  const handleChangeEmissionPoint = async (value: string) => {
    const result = await getNextSequenceDocumentNumber(value, "INVOICE");
    if (result.success && result.nextSequence !== undefined) {
      setValue("sequential", result.nextSequence);
    }
  };

  const handleChangeTerm = (termDays: number) => {
    if (isNaN(termDays) || termDays < 0) {
      const issueDate: Date = getValues("issueDate");
      setValue("dueDate", issueDate);
      return;
    }

    const issueDate: Date = getValues("issueDate");
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + termDays);
    setValue("dueDate", dueDate);
  };

  const handleChangeIssueDate = (date: Date) => {
    const termDays: number = getValues("term");
    const dueDate = new Date(date);
    dueDate.setDate(dueDate.getDate() + termDays);
    setValue("dueDate", dueDate);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Información del Documento
      </Typography>
      <Stack spacing={2} mt={2}>
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Autocomplete
                      options={clients}
                      getOptionLabel={(option) =>
                        `[${option.identification}] - ${option.name}`
                      }
                      value={clients.find((c: any) => c.id === value) || null}
                      onChange={(_, newValue) => onChange(newValue?.id || "")}
                      fullWidth
                      // disabled={modeEdit}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cliente"
                          size="small"
                          fullWidth
                          error={!!errors.customerId}
                          helperText={
                            errors.customerId?.message?.toString() || ""
                          }
                        />
                      )}
                    />
                  )}
                />
                <IconButton color="primary">
                  <UserPlus size={20} />
                </IconButton>
              </Stack>
              <Controller
                name="establishmentId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Establecimiento"
                    size="small"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChangeEstablishment(e.target.value);
                    }}
                    error={!!errors.establishmentId}
                    helperText={
                      errors.establishmentId?.message?.toString() || ""
                    }
                    disabled={modeEdit}
                  >
                    {establishments.map((est: any) => (
                      <MenuItem key={est.id} value={est.id}>
                        {est.code}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="emissionPointId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Punto de Emisión"
                    size="small"
                    fullWidth
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChangeEmissionPoint(e.target.value);
                    }}
                    error={!!errors.emissionPointId}
                    helperText={
                      errors.emissionPointId?.message?.toString() || ""
                    }
                    disabled={modeEdit}
                  >
                    {emissionPoints.map(
                      (ep: EmissionPointWithEstablishmentSchema) => (
                        <MenuItem key={ep.id} value={ep.id}>
                          {ep.code}
                        </MenuItem>
                      )
                    )}
                  </TextField>
                )}
              />

              <Controller
                name="sequential"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número Secuencial"
                    type="number"
                    size="small"
                    fullWidth
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                    value={
                      field.value ? field.value.toString().padStart(8, "0") : ""
                    }
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                    error={!!errors.sequential}
                    helperText={errors.sequential?.message?.toString() || ""}
                    disabled={modeEdit}
                  />
                )}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
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
                    InputLabelProps={{ shrink: true }}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().substring(0, 10)
                        : ""
                    }
                    onChange={(e) => {
                      field.onChange(new Date(e.target.value));
                      handleChangeIssueDate(new Date(e.target.value));
                    }}
                    error={!!errors.issueDate}
                    helperText={errors.issueDate?.message?.toString() || ""}
                  />
                )}
              />
              <Controller
                name="term"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Plazo (días)"
                    type="number"
                    size="small"
                    fullWidth
                    onChange={(e) => {
                      field.onChange(parseInt(e.target.value, 10));
                      handleChangeTerm(parseInt(e.target.value, 10));
                    }}
                    value={field.value || 0}
                    error={!!errors.term}
                    helperText={errors.term?.message?.toString() || ""}
                  />
                )}
              />

              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fecha de Vencimiento"
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().substring(0, 10)
                        : ""
                    }
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    error={!!errors.dueDate}
                    helperText={errors.dueDate?.message?.toString() || ""}
                    slotProps={{
                      input: { readOnly: true },
                    }}
                  />
                )}
              />
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
