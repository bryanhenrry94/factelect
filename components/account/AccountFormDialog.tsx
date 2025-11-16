import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertService } from "@/lib/alerts";
import { CreateAccount, createAccountSchema } from "@/lib/validations";
import { createAccount, updateAccount } from "@/app/actions";
import { accountTypes } from "@/utils/account";

interface AccountFormDialogProps {
  id?: string;
  open: boolean;
  handleClose: () => void;
  initialData: CreateAccount | null;
  onSuccess?: () => void;
}

export const AccountFormDialog = ({
  id,
  open,
  handleClose,
  initialData,
  onSuccess,
}: AccountFormDialogProps) => {
  const { data: session } = useSession();
  const [modeEdit, setModeEdit] = useState<boolean>(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm<CreateAccount>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: initialData || {
      name: "",
      type: "BANK",
      currency: "USD",
      bank: null,
      number: null,
      last4: null,
    },
  });

  const onSubmit = async (data: CreateAccount) => {
    if (!session?.user?.tenantId) return;

    const response =
      modeEdit && id
        ? await updateAccount(id, data)
        : await createAccount(data, session.user.tenantId);

    if (response.success) {
      AlertService.showSuccess(
        modeEdit
          ? "Cuenta actualizada exitosamente."
          : "Cuenta creada exitosamente."
      );

      onSuccess?.();
      handleClose();
      reset();
    } else {
      AlertService.showError(
        "Ocurrió un error. Por favor, inténtalo de nuevo."
      );
    }
  };

  useEffect(() => {
    if (initialData) {
      setModeEdit(true);
      reset(initialData);
    } else {
      setModeEdit(false);
      reset({
        name: "",
        type: "BANK",
        currency: "USD",
        bank: null,
        number: null,
        last4: null,
      });
    }
  }, [initialData, reset]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {modeEdit ? "Editar Cuenta" : "Agregar Cuenta"}
        </Typography>
        {/* Form fields for adding/editing bank account would go here */}
        <Box sx={{ mt: 2 }}>
          <Box
            component={"form"}
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nombre de la Cuenta"
                  fullWidth
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name ? errors.name.message : ""}
                />
              )}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Tipo de Cuenta"
                  type="text"
                  fullWidth
                  margin="normal"
                  error={!!errors.type}
                  helperText={errors.type ? errors.type.message : ""}
                  select
                  value={field.value || ""}
                >
                  {accountTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            {watch("type") === "BANK" && (
              <Controller
                name="number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número de Cuenta"
                    fullWidth
                    margin="normal"
                    error={!!errors.number}
                    helperText={errors.number ? errors.number.message : ""}
                    value={field.value || ""}
                  />
                )}
              />
            )}
            {watch("type") === "CREDIT_CARD" && (
              <Controller
                name="last4"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Últimos 4 Dígitos"
                    fullWidth
                    margin="normal"
                    error={!!errors.last4}
                    helperText={errors.last4 ? errors.last4.message : ""}
                    value={field.value || ""}
                  />
                )}
              />
            )}

            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Moneda"
                  fullWidth
                  margin="normal"
                  error={!!errors.currency}
                  helperText={errors.currency ? errors.currency.message : ""}
                  value={field.value || ""}
                />
              )}
            />
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={handleClose} sx={{ mr: 2 }}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {modeEdit ? "Guardar Cambios" : "Agregar Cuenta"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};
