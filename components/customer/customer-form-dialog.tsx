import { createCustomer, updateCustomer } from "@/app/actions/customer";
import { identificationOptions } from "@/constants/identification";
import { AlertService } from "@/lib/alerts";
import {
  CustomerCreate,
  CustomerCreateSchema,
  CustomerReponse,
} from "@/lib/validations/customer";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingCustomer: CustomerReponse | null;
  tenantId: string;
  setError: (error: string | null) => void;
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  editingCustomer,
  tenantId,
  setError,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CustomerCreate>({
    resolver: zodResolver(CustomerCreateSchema),
    defaultValues: editingCustomer ?? {
      identificationType: "CEDULA",
      identification: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  // Rellena el formulario si se está editando
  useEffect(() => {
    if (editingCustomer) {
      reset(editingCustomer);
    } else {
      reset({
        identificationType: "CEDULA",
        identification: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
    }
  }, [editingCustomer, reset]);

  const onSubmit = async (data: CustomerCreate) => {
    setError(null);

    const action = editingCustomer
      ? await updateCustomer(editingCustomer.id, data)
      : await createCustomer(data, tenantId);

    if (action.success) {
      AlertService.showSuccess(
        editingCustomer ? "Cliente actualizado" : "Cliente creado"
      );
      await onSuccess();
      onClose();
    } else {
      setError(action.error || "Error al guardar el cliente");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>
          {editingCustomer ? "Editar Cliente" : "Agregar Cliente"}
        </DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {editingCustomer
              ? "Actualiza la información del cliente."
              : "Agrega un nuevo cliente a tu base de datos."}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Tipo de Identificación"
                {...register("identificationType")}
                error={!!errors.identificationType}
                helperText={errors.identificationType?.message}
                value={watch("identificationType") || "CEDULA"}
                fullWidth
              >
                {identificationOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Identificación"
                {...register("identification")}
                error={!!errors.identification}
                helperText={errors.identification?.message}
                fullWidth
              />
            </Grid>
          </Grid>

          <TextField
            label="Nombre"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />

          <TextField
            label="Correo electrónico"
            type="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />

          <TextField label="Teléfono" {...register("phone")} fullWidth />
          <TextField label="Dirección" {...register("address")} fullWidth />
          <TextField
            label="Notas"
            {...register("notes")}
            multiline
            rows={3}
            fullWidth
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {editingCustomer ? "Actualizar" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CustomerFormDialog;
