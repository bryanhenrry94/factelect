import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { createCashBox, updateCashBox } from "@/actions/cash/cash-box";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { ChartOfAccount } from "@/lib/validations";
import {
  CashBox,
  CreateCashBox,
  createCashBoxSchema,
} from "@/lib/validations/cash/cash_box";
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

const initialState: CreateCashBox = {
  name: "",
  location: "",
};

interface CashBoxFormProps {
  cashBoxSelected?: CashBox | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export const CashBoxForm: React.FC<CashBoxFormProps> = ({
  cashBoxSelected,
  onSave,
  onCancel,
}) => {
  const { data: session } = useSession();
  const [accounts, setAccounts] = React.useState<ChartOfAccount[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCashBox>({
    resolver: zodResolver(createCashBoxSchema),
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
    reset(cashBoxSelected || initialState);
  }, [cashBoxSelected, reset]);

  const onSubmit = async (data: CreateCashBox) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = cashBoxSelected
        ? await updateCashBox(cashBoxSelected.id, data)
        : await createCashBox(session.user.tenantId, data);

      if (response.success) {
        notifyInfo(
          `Caja ${cashBoxSelected ? "actualizado" : "registrado"} correctamente`
        );
        onSave?.();
      } else {
        notifyError("Error al guardar la caja");
      }
    } catch (error) {
      notifyError("Error inesperado al guardar la caja");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle>
        {cashBoxSelected ? "Editar Caja" : "Registrar Caja"}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {cashBoxSelected
            ? "Actualiza los datos de la caja."
            : "Registra una nueva caja."}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {/* Nombre */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nombre"
                fullWidth
                margin="dense"
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />

          {/* Ubicación */}
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Ubicación"
                fullWidth
                margin="dense"
                error={!!errors.location}
                helperText={errors.location?.message}
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
