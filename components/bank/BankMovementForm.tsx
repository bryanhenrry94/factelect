import { getAllBankAccounts } from "@/actions/bank/bank-account";
import {
  createBankMovement,
  updateBankMovement,
} from "@/actions/bank/bank-movement";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { BankAccount } from "@/lib/validations/bank/bank_account";
import {
  BankMovement,
  BankMovementSchema,
} from "@/lib/validations/bank/bank_movement";
import { $Enums } from "@/prisma/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

const bankMovementTypeLabels: Record<$Enums.BankMovementType, string> = {
  DEPOSIT: "Depósito",
  WITHDRAWAL: "Retiro",
  TRANSFER_IN: "Transferencia Entrante",
  TRANSFER_OUT: "Transferencia Saliente",
  FEE: "Comisión",
};

const initialBankMovement: BankMovement = {
  id: "",
  tenantId: "",
  bankAccountId: "",
  type: $Enums.BankMovementType.DEPOSIT,
  date: new Date(),
  amount: 0,
  description: "",
  reference: "",
  accountId: "",
  createdAt: new Date(),
};

interface BankMovementFormProps {
  bankMovementSelected?: BankMovement | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export const BankMovementForm: React.FC<BankMovementFormProps> = ({
  bankMovementSelected,
  onSave,
  onCancel,
}) => {
  const { data: session } = useSession();
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BankMovement>({
    resolver: zodResolver(BankMovementSchema),
    defaultValues: initialBankMovement,
  });

  /** 🔄 Cargar cuentas bancarias */
  useEffect(() => {
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

    fetchBankAccounts();
  }, [session?.user?.tenantId]);

  /** 🔄 Cargar o limpiar movimiento editable */
  useEffect(() => {
    reset(bankMovementSelected || initialBankMovement);
  }, [bankMovementSelected, reset]);

  /** 💾 Guardar */
  const onSubmit = async (data: BankMovement) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = bankMovementSelected
        ? await updateBankMovement(bankMovementSelected.id, data)
        : await createBankMovement(session.user.tenantId, data);

      if (response.success) {
        notifyInfo(
          `Movimiento ${
            bankMovementSelected ? "actualizado" : "registrado"
          } correctamente`
        );
        onSave?.();
      } else {
        notifyError("Error al guardar el movimiento");
      }
    } catch (error) {
      notifyError("Error inesperado al guardar el movimiento");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>
        {bankMovementSelected ? "Editar Movimiento" : "Registrar Movimiento"}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {bankMovementSelected
            ? "Actualiza los datos del movimiento bancario."
            : "Registra un nuevo movimiento bancario."}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column" }}>
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
              >
                {bankAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.bankName} - {account.accountNumber}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

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
              >
                {Object.values($Enums.BankMovementType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {bankMovementTypeLabels[type]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {/* Cantidad */}
          <Controller
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
                  field.onChange(
                    isNaN(numeric) ? 0 : Number(numeric.toFixed(2))
                  );
                }}
                inputProps={{ inputMode: "decimal" }}
                type="number"
                error={!!errors.amount}
                helperText={errors.amount?.message}
              />
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Fecha"
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
              />
            )}
          />

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
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />

          {/* Botones */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: 2,
            }}
          >
            <Button onClick={onCancel}>Cancelar</Button>
            <Button variant="contained" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar Movimiento"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </form>
  );
};
