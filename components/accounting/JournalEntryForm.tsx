"use client";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { getCostCenters } from "@/actions/accounting/cost-center";
import {
  createJournalEntry,
  updateJournalEntry,
} from "@/actions/accounting/journal-entry";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { Account } from "@/lib/validations";
import { CostCenter } from "@/lib/validations/accounting/cost-center";
import {
  CreateJournalEntry,
  createJournalEntrySchema,
  JournalEntry,
} from "@/lib/validations/accounting/journal_entry";
import { $Enums } from "@/prisma/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Delete, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

const initialState: CreateJournalEntry = {
  date: new Date(),
  description: "",
  type: $Enums.EntryType.JOURNAL,
  documentType: $Enums.DocumentType.OTHER,
  documentId: "null",
  entries: [
    {
      accountId: "",
      debit: 0,
      credit: 0,
      costCenterId: null,
    },
    {
      accountId: "",
      debit: 0,
      credit: 0,
      costCenterId: null,
    },
  ],
};

interface JournalEntryFormProps {
  journalEntryToEdit: JournalEntry | null;
}

export const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
  journalEntryToEdit,
}) => {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchCostCenters();
  }, [session?.user?.tenantId]);

  const fetchAccounts = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getAccounts(session.user.tenantId);
      if (response.success) {
        setAccounts(response.data || []);
      } else {
        notifyError("Error al cargar las cuentas");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      notifyError("Error al cargar las cuentas");
    }
  };

  const fetchCostCenters = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getCostCenters(session.user.tenantId);
      if (response.success) {
        setCostCenters(response.data || []);
        return;
      } else {
        notifyError("Error al cargar los centros de costo");
      }
      setCostCenters([]);
    } catch (error) {
      console.error("Error fetching cost centers:", error);
      notifyError("Error al cargar los centros de costo");
    }
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateJournalEntry>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: initialState,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "entries",
  });

  useEffect(() => {
    if (journalEntryToEdit) {
      reset({
        date: journalEntryToEdit.date,
        description: journalEntryToEdit.description,
        type: journalEntryToEdit.type,
        documentType: journalEntryToEdit.documentType,
        documentId: journalEntryToEdit.documentId,
        entries: journalEntryToEdit.entries.map((entry) => ({
          accountId: entry.accountId,
          debit: entry.debit,
          credit: entry.credit,
          costCenterId: entry.costCenterId,
        })),
      });
    } else {
      reset(initialState);
    }
  }, [journalEntryToEdit, reset]);

  const onSubmit = async (data: CreateJournalEntry) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = journalEntryToEdit
        ? await updateJournalEntry(journalEntryToEdit.id, data)
        : await createJournalEntry(session.user.tenantId, data);

      if (response.success) {
        await notifyInfo(
          `Asiento contable ${
            journalEntryToEdit ? "actualizado" : "creado"
          } correctamente`
        );

        if (journalEntryToEdit) {
          return;
        } else {
          reset(initialState);
        }
      } else {
        notifyError(response.error || "Error al guardar el asiento contable");
      }
    } catch (error) {
      console.log(error);
      notifyError("Error al guardar el asiento contable");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Fecha"
              type="date"
              variant="outlined"
              //   fullWidth
              margin="dense"
              size="small"
              onChange={(e) => {
                const selectedDate = e.target.value;
                field.onChange(new Date(selectedDate));
              }}
              value={field.value ? field.value.toISOString().split("T")[0] : ""}
              error={errors.date ? true : false}
              helperText={errors.date?.message}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Glosa"
              variant="outlined"
              fullWidth
              margin="dense"
              size="small"
              error={errors.description ? true : false}
              helperText={errors.description?.message}
              multiline
              rows={3}
            />
          )}
        />

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
                <TableCell>Cuenta</TableCell>
                <TableCell align="center">Débito</TableCell>
                <TableCell align="center">Crédito</TableCell>
                <TableCell align="center">Centro de costo</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {fields.map((field, index) => (
                <TableRow
                  key={field.id}
                  hover
                  sx={{
                    "& td": { py: 1 },
                  }}
                >
                  {/* Cuenta */}
                  <TableCell sx={{ width: 260 }}>
                    <Controller
                      control={control}
                      name={`entries.${index}.accountId`}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Cuenta"
                          variant="outlined"
                          size="small"
                          fullWidth
                          select
                          value={field.value || ""}
                        >
                          {accounts.map((account) => (
                            <MenuItem key={account.id} value={account.id}>
                              {account.code} {account.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>

                  {/* Débito */}
                  <TableCell align="right" sx={{ width: 140 }}>
                    <Controller
                      name={`entries.${index}.debit`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Débito"
                          variant="outlined"
                          size="small"
                          type="number"
                          fullWidth
                          onChange={(e) => {
                            const text = e.target.value;

                            // Mantén siempre string en el campo
                            field.onChange(text);
                          }}
                          onBlur={() => {
                            const numeric = parseFloat(
                              field.value ? field.value.toString() : "0"
                            );

                            // Al salir del input conviertes a number seguro
                            field.onChange(
                              isNaN(numeric) ? 0 : Number(numeric.toFixed(2))
                            );
                          }}
                          inputProps={{ inputMode: "decimal" }}
                        />
                      )}
                    />
                  </TableCell>

                  {/* Crédito */}
                  <TableCell align="right" sx={{ width: 140 }}>
                    <Controller
                      name={`entries.${index}.credit`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Crédito"
                          variant="outlined"
                          size="small"
                          type="number"
                          fullWidth
                          onChange={(e) => {
                            const text = e.target.value;

                            // Mantén siempre string en el campo
                            field.onChange(text);
                          }}
                          onBlur={() => {
                            const numeric = parseFloat(
                              field.value ? field.value.toString() : "0"
                            );

                            // Al salir del input conviertes a number seguro
                            field.onChange(
                              isNaN(numeric) ? 0 : Number(numeric.toFixed(2))
                            );
                          }}
                          inputProps={{ inputMode: "decimal" }}
                        />
                      )}
                    />
                  </TableCell>

                  {/* Centro de costo */}
                  <TableCell sx={{ width: 220 }}>
                    <Controller
                      name={`entries.${index}.costCenterId`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Centro de costo"
                          variant="outlined"
                          size="small"
                          fullWidth
                          value={field.value || ""}
                          select
                        >
                          <MenuItem value="">Ninguno</MenuItem>
                          {costCenters.map((costCenter) => (
                            <MenuItem key={costCenter.id} value={costCenter.id}>
                              {costCenter.code} {costCenter.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>

                  {/* Eliminar */}
                  <TableCell align="center" sx={{ width: 60 }}>
                    <IconButton
                      color="error"
                      onClick={() => remove(index)}
                      sx={{ p: 0.5 }}
                    >
                      <Delete size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {/* Totales */}
              <TableRow>
                <TableCell align="right">
                  <strong>Totales:</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>
                    {fields
                      .reduce((sum, entry, idx) => {
                        const value = parseFloat(
                          watch(`entries.${idx}.debit`)?.toString() || "0"
                        );
                        return sum + (isNaN(value) ? 0 : value);
                      }, 0)
                      .toFixed(2)}
                  </strong>
                </TableCell>
                <TableCell align="right">
                  <strong>
                    {fields
                      .reduce((sum, entry, idx) => {
                        const value = parseFloat(
                          watch(`entries.${idx}.credit`)?.toString() || "0"
                        );
                        return sum + (isNaN(value) ? 0 : value);
                      }, 0)
                      .toFixed(2)}
                  </strong>
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>

              {/* Agregar línea */}
              <TableRow>
                <TableCell colSpan={5} align="left" sx={{ py: 2.5 }}>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      append({
                        accountId: "",
                        debit: 0,
                        credit: 0,
                        costCenterId: null,
                      })
                    }
                    sx={{ textTransform: "none", px: 3 }}
                    startIcon={<Plus size={16} />}
                  >
                    Agregar línea
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 2,
          }}
        >
          <Button
            variant="contained"
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </Box>
      </Box>
    </form>
  );
};
