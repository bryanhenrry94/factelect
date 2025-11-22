import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getAccounts } from "@/app/actions/account";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { Account } from "@/lib/validations";
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
import { Controller, useForm } from "react-hook-form";
import {
  CashMovement,
  CreateCashMovement,
  createCashMovementSchema,
} from "@/lib/validations/cash_movement";
import {
  createCashMovement,
  updateCashMovement,
} from "@/app/actions/cash-movement";
import { getOpenCashSession } from "@/app/actions/cash-session";

const initialState: CreateCashMovement = {
  type: "IN",
  category: "OTHER",
  amount: 0,
  description: "",
  cashSessionId: "",
  accountId: null,
};

interface CashMovementFormProps {
  cashMovementSelected?: CashMovement | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export const CashMovementForm: React.FC<CashMovementFormProps> = ({
  cashMovementSelected,
  onSave,
  onCancel,
}) => {
  const { data: session } = useSession();
  const [accounts, setAccounts] = React.useState<Account[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCashMovement>({
    resolver: zodResolver(createCashMovementSchema),
    defaultValues: initialState,
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!session?.user?.tenantId) return;

      try {
        const response = await getAccounts(session.user.tenantId);

        if (response.success && response.data) {
          setAccounts(response.data);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchAccounts();
  }, [session?.user?.tenantId]);

  useEffect(() => {
    reset(cashMovementSelected || initialState);
  }, [cashMovementSelected, reset]);

  const onSubmit = async (data: CreateCashMovement) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const res = await getOpenCashSession(
        session.user.tenantId,
        session.user.id
      );

      if (!res.success) {
        notifyError("Error al obtener la sesión de caja abierta");
        return;
      }

      const cashSession = res.data;
      if (!cashSession) {
        notifyError("No hay una sesión de caja abierta para el usuario");
        return;
      }

      data.cashSessionId = cashSession.id;

      const response = cashMovementSelected
        ? await updateCashMovement(cashMovementSelected.id, data)
        : await createCashMovement(session.user.tenantId, data);

      if (response.success) {
        notifyInfo(
          `Caja ${
            cashMovementSelected ? "actualizado" : "registrado"
          } correctamente`
        );
        onSave?.();
      } else {
        notifyError("Error al guardar el movimiento de caja");
      }
    } catch (error) {
      notifyError("Error inesperado al guardar el movimiento de caja");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>
        {cashMovementSelected
          ? "Editar Movimiento de Caja"
          : "Registrar Movimiento de Caja"}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {cashMovementSelected
            ? "Actualiza los datos del movimiento de caja."
            : "Registra un nuevo movimiento de caja."}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {/* Nombre */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Tipo"
                fullWidth
                margin="dense"
                error={!!errors.type}
                helperText={errors.type?.message}
                select
                value={field.value || ""}
              >
                <MenuItem value="IN">Ingreso</MenuItem>
                <MenuItem value="OUT">Egreso</MenuItem>
              </TextField>
            )}
          />

          {/* Categoría */}
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Categoría"
                fullWidth
                margin="dense"
                error={!!errors.category}
                helperText={errors.category?.message}
                select
                value={field.value || ""}
              >
                <MenuItem value="SALE">Venta</MenuItem>
                <MenuItem value="PURCHASE">Compra</MenuItem>
                <MenuItem value="PETTY_CASH">Caja Chica</MenuItem>
                <MenuItem value="ADVANCE">Anticipo</MenuItem>
                <MenuItem value="REFUND">Reembolso</MenuItem>
                <MenuItem value="TRANSFER">Transferencia</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </TextField>
            )}
          />

          {/* Monto */}
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

          {/* Cuenta Contable */}
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Cuenta Contable"
                fullWidth
                margin="dense"
                error={!!errors.accountId}
                helperText={errors.accountId?.message}
                value={field.value || ""}
                select
              >
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </MenuItem>
                ))}
              </TextField>
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
              {isSubmitting ? "Guardando..." : "Guardar Caja"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </form>
  );
};
