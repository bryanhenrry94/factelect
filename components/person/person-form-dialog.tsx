import { createPerson, updatePerson } from "@/app/actions";
import { identificationOptions } from "@/constants/identification";
import { AlertService } from "@/lib/alerts";
import {
  CreatePersonInput,
  createPersonSchema,
  PersonInput,
} from "@/lib/validations/person";
import { getRoleLabel } from "@/utils/person";
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
import { Controller, useForm } from "react-hook-form";

interface PersonFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingPerson: PersonInput | null;
  tenantId: string;
  setError: (error: string | null) => void;
}

const PersonFormDialog: React.FC<PersonFormDialogProps> = ({
  open,
  onClose,
  onSuccess,
  editingPerson,
  tenantId,
  setError,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    control,
  } = useForm<CreatePersonInput>({
    resolver: zodResolver(createPersonSchema),
    defaultValues: editingPerson ?? {
      identificationType: "CEDULA",
      identification: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      roles: ["CLIENT"],
    },
  });

  // Rellena el formulario si se está editando
  useEffect(() => {
    if (editingPerson) {
      reset(editingPerson);
    } else {
      reset({
        identificationType: "CEDULA",
        identification: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        roles: ["CLIENT"],
      });
    }
  }, [editingPerson, reset]);

  const onSubmit = async (data: CreatePersonInput) => {
    setError(null);

    const action = editingPerson
      ? await updatePerson(editingPerson.id ?? "", data)
      : await createPerson(data, tenantId);

    if (action.success) {
      AlertService.showSuccess(
        editingPerson ? "Persona actualizado" : "Persona creado"
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
          {editingPerson ? "Editar Persona" : "Agregar Persona"}
        </DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {editingPerson
              ? "Actualiza la información de la persona."
              : "Agrega una nueva persona a tu base de datos."}
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
            label="Nombres"
            {...register("firstName")}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            fullWidth
          />
          <TextField
            label="Apellidos"
            {...register("lastName")}
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
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

          <Controller
            name="roles"
            control={control}
            defaultValue={[]} // obligatorio cuando es multiple
            render={({ field }) => (
              <TextField
                select
                label="Roles"
                {...field}
                error={!!errors.roles}
                helperText={errors.roles?.message}
                SelectProps={{
                  multiple: true,
                }}
                fullWidth
              >
                {["CLIENT", "SUPPLIER", "SELLER"].map((role) => (
                  <MenuItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {editingPerson ? "Actualizar" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PersonFormDialog;
