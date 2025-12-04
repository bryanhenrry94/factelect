import { getAccounts } from "@/actions/accounting/chart-of-account";
import { getCostCenters } from "@/actions/accounting/cost-center";
import { getAllBankAccounts } from "@/actions/bank/bank-account";
import {
  createBankMovement,
  getBankMovementById,
  updateBankMovement,
} from "@/actions/bank/bank-movement";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { ChartOfAccount } from "@/lib/validations";
import { CostCenter } from "@/lib/validations/accounting/cost-center";
import { BankAccount } from "@/lib/validations/bank/bank_account";
import {
  BankMovement,
  BankMovementSchema,
} from "@/lib/validations/bank/bank_movement";
import { $Enums } from "@/prisma/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Autocomplete,
  Box,
  Button,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Delete, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

const bankMovementTypeLabels: Record<$Enums.BankMovementType, string> = {
  DEBIT: "Nota de Débito",
  CREDIT: "Nota de Crédito",
};

const initialBankMovement: BankMovement = {
  id: "",
  tenantId: "",
  bankAccountId: "",
  type: $Enums.BankMovementType.DEBIT,
  date: new Date(),
  amount: 0,
  description: "",
  reference: "",
  createdAt: new Date(),
};

interface BankMovementFormProps {
  bankMovementId?: string;
}

export const BankMovementForm: React.FC<BankMovementFormProps> = ({
  bankMovementId,
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<BankMovement>({
    resolver: zodResolver(BankMovementSchema),
    defaultValues: initialBankMovement,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details",
  });

  const fetchBankAccounts = async () => {
    if (!session?.user?.tenantId) return;

    try {
      const response = await getAllBankAccounts(session.user.tenantId);

      if (response.success && response.data) {
        setBankAccounts(response.data);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    }
  };

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

  /** 🔄 Cargar cuentas bancarias */
  useEffect(() => {
    fetchBankAccounts();
    fetchAccounts();
    fetchCostCenters();
  }, [session?.user?.tenantId]);

  /** 🔄 Cargar o limpiar movimiento editable */
  useEffect(() => {
    if (!bankMovementId) {
      reset(initialBankMovement);
      return;
    }

    const fetchBankMovement = async () => {
      try {
        const response = await getBankMovementById(bankMovementId);
        if (response.success && response.data) {
          reset(response.data);
        } else {
          notifyError("No se pudo cargar el movimiento bancario");
        }
      } catch (error) {
        notifyError("Error al cargar el movimiento bancario");
        console.error("Error fetching bank movement:", error);
      }
    };

    fetchBankMovement();
  }, [bankMovementId, reset]);

  /** 💾 Guardar */
  const onSubmit = async (data: BankMovement) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = bankMovementId
        ? await updateBankMovement(bankMovementId, data)
        : await createBankMovement(session.user.tenantId, data);

      if (response.success) {
        notifyInfo(
          `Movimiento ${
            bankMovementId ? "actualizado" : "registrado"
          } correctamente`
        );

        router.push(`/bancos/movimientos/${response.data?.id}/editar`);
      } else {
        notifyError("Error al guardar el movimiento");
      }
    } catch (error) {
      notifyError("Error inesperado al guardar el movimiento");
      console.error(error);
    }
  };

  const details = watch("details");
  useEffect(() => {
    const total = (details || []).reduce(
      (sum: number, item: any) => sum + (Number(item.amount) || 0),
      0
    );
    setValue("amount", total);
  }, [details?.map((d) => d.amount).join(","), setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ display: "flex", flexDirection: "column", maxWidth: 400 }}>
        {/* Tipo de Movimiento */}
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Tipo de Movimiento"
              fullWidth
              margin="dense"
              error={!!errors.type}
              helperText={errors.type?.message}
              select
              size="small"
            >
              {Object.values($Enums.BankMovementType).map((type) => (
                <MenuItem key={type} value={type}>
                  {bankMovementTypeLabels[type]}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Fecha de Emisión"
              type="date"
              fullWidth
              margin="dense"
              value={
                field.value
                  ? new Date(field.value).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => {
                field.onChange(new Date(e.target.value));
              }}
              InputLabelProps={{
                shrink: true,
              }}
              error={!!errors.date}
              helperText={errors.date?.message}
              size="small"
            />
          )}
        />

        {/* Cuenta Bancaria */}
        <Controller
          name="bankAccountId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Cuenta Bancaria"
              fullWidth
              margin="dense"
              error={!!errors.bankAccountId}
              helperText={errors.bankAccountId?.message}
              select
              size="small"
            >
              {bankAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.bankName} - {account.accountNumber}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* Monto */}
        {/* <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Monto"
              fullWidth
              margin="dense"
              value={field.value ?? 1}
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
                field.onChange(isNaN(numeric) ? 0 : Number(numeric.toFixed(2)));
              }}
              inputProps={{ inputMode: "decimal" }}
              type="number"
              error={!!errors.amount}
              helperText={errors.amount?.message}
              size="small"
            />
          )}
        /> */}

        {/* Referencia */}
        <Controller
          name="reference"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Referencia"
              fullWidth
              margin="dense"
              error={!!errors.reference}
              helperText={errors.reference?.message}
              size="small"
            />
          )}
        />

        {/* Descripción */}
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Descripción"
              fullWidth
              margin="dense"
              multiline
              rows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
              size="small"
            />
          )}
        />
      </Box>
      {/* Cuentas */}
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
              <TableCell align="center">Monto</TableCell>
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
                <TableCell sx={{ width: 300 }}>
                  <Controller
                    name={`details.${index}.accountId`}
                    control={control}
                    render={({ field }) => {
                      const selectedOption =
                        accounts.find((a) => a.id === field.value) || null;

                      return (
                        <Autocomplete
                          options={accounts}
                          getOptionLabel={(option) =>
                            `${option.code} ${option.name}`
                          }
                          value={selectedOption}
                          onChange={(_, value) => {
                            field.onChange(value ? value.id : "");
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              // label="Cuenta Contable"
                              variant="outlined"
                              margin="dense"
                              error={!!errors.details?.[index]?.accountId}
                              helperText={
                                errors.details?.[index]?.accountId?.message
                              }
                              value={field.value || ""}
                              size="small"
                              fullWidth
                            />
                          )}
                        />
                      );
                    }}
                  />
                </TableCell>

                {/* Valor */}
                <TableCell align="right" sx={{ width: 140 }}>
                  <Controller
                    name={`details.${index}.amount`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        // label="Monto"
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
                    name={`details.${index}.costCenterId`}
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

            {/* Agregar línea */}
            <TableRow>
              <TableCell colSpan={5} align="left" sx={{ py: 2.5 }}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    append({
                      accountId: "",
                      amount: 0,
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
      {/* Botones */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          mt: 2,
        }}
      >
        <Button variant="contained" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Movimiento"}
        </Button>
      </Box>
    </form>
  );
};
