import { getAllBankAccounts } from "@/actions/bank/bank-account";
import {
  createBankTransfer,
  updateBankTransfer,
} from "@/actions/bank/bank-transfer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { BankAccount } from "@/lib/validations/bank/bank_account";
import {
  BankTransfer,
  CreateBankTransfer,
  createBankTransferSchema,
} from "@/lib/validations/bank/bank_transfer";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

const initialState: BankTransfer = {
  id: "",
  tenantId: "",
  fromAccountId: "",
  toAccountId: "",
  amount: 0,
  date: new Date(),
  description: "",
  reference: "",
  movementOutId: "",
  movementInId: "",
  createdAt: new Date(),
};

interface BankTransferFormProps {
  bankTransferSelected?: BankTransfer | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export const BankTransferForm: React.FC<BankTransferFormProps> = ({
  bankTransferSelected,
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
  } = useForm<CreateBankTransfer>({
    resolver: zodResolver(createBankTransferSchema),
    defaultValues: initialState,
  });

  /** Cargar cuentas bancarias */
  useEffect(() => {
    const load = async () => {
      if (!session?.user?.tenantId) return;

      const res = await getAllBankAccounts(session.user.tenantId);
      if (res.success && res.data) setBankAccounts(res.data);
    };

    load();
  }, [session?.user?.tenantId]);

  /** Cargar / resetear formulario */
  useEffect(() => {
    console.log("bankTransferSelected", bankTransferSelected);
    reset(bankTransferSelected || initialState);
  }, [bankTransferSelected, reset]);

  /** Guardar */
  const onSubmit = async (data: CreateBankTransfer) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = bankTransferSelected
        ? await updateBankTransfer(bankTransferSelected.id, data)
        : await createBankTransfer(session.user.tenantId, data);

      if (response.success) {
        notifyInfo(
          bankTransferSelected
            ? "Traspaso actualizado correctamente"
            : "Traspaso registrado correctamente"
        );
        onSave?.();
      } else {
        notifyError("Error al guardar el traspaso");
      }
    } catch (error) {
      notifyError("Error inesperado al guardar el traspaso");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle sx={{ fontWeight: 600 }}>
        {bankTransferSelected
          ? "Editar Traspaso Bancario"
          : "Nuevo Traspaso Bancario"}
      </DialogTitle>

      <DialogContent>
        {/* INTRO */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {bankTransferSelected
            ? "Actualiza la información del traspaso entre cuentas."
            : "Registra un movimiento de fondos entre tus cuentas bancarias."}
        </Typography>

        {/* SECCIÓN DE CUENTAS */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Cuentas
        </Typography>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            mb: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            bgcolor: "background.paper",
          }}
        >
          {/* Cuenta Origen */}
          <Box>
            <Typography fontSize={13} sx={{ mb: 0.5 }}>
              Cuenta Origen
            </Typography>
            <Controller
              name="fromAccountId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  error={!!errors.fromAccountId}
                  helperText={errors.fromAccountId?.message}
                  sx={{ width: { xs: "100%", sm: 300 } }}
                >
                  {bankAccounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>
                      {acc.bankName} – {acc.accountNumber}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>

          {/* Flecha */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 3,
            }}
          >
            <ArrowRight size={22} color="#888" />
          </Box>

          {/* Cuenta Destino */}
          <Box>
            <Typography fontSize={13} sx={{ mb: 0.5 }}>
              Cuenta Destino
            </Typography>
            <Controller
              name="toAccountId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  error={!!errors.toAccountId}
                  helperText={errors.toAccountId?.message}
                  sx={{ width: { xs: "100%", sm: 300 } }}
                >
                  {bankAccounts
                    .filter(
                      (acc) => acc.id !== control._formValues.fromAccountId
                    )
                    .map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.bankName} – {acc.accountNumber}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
          </Box>
        </Box>

        {/* MONTO */}
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
                field.onChange(isNaN(numeric) ? 0 : Number(numeric.toFixed(2)));
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
              type="date"
              fullWidth
              label="Fecha"
              margin="dense"
              value={
                field.value
                  ? new Date(field.value).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => field.onChange(new Date(e.target.value))}
            />
          )}
        />

        {/* BOTONES */}
        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Procesando..."
              : bankTransferSelected
              ? "Actualizar"
              : "Registrar Traspaso"}
          </Button>
        </Box>
      </DialogContent>
    </form>
  );
};
