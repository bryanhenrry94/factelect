import { createPerson, updatePerson } from "@/app/actions";
import { identificationOptions } from "@/constants/identification";
import { AlertService } from "@/lib/alerts";
import {
  CreatePersonInput,
  createPersonSchema,
  PersonInput,
  personSchema,
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
import { z } from "zod";

interface PersonFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (isUpdate: boolean) => Promise<void>;
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
    resolver: zodResolver(
      personSchema
        .omit({
          id: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
        })
        .extend({
          identification: z.string(),
        })
        .superRefine((data, ctx) => {
          const val = data.identification ?? "";
          const type = data.identificationType;
          if (type === "RUC") {
            if (!/^\d{13}$/.test(val)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["identification"],
                message: "El RUC debe contener exactamente 13 dígitos numéricos",
              });
            }
          } else if (type === "CEDULA") {
            if (!/^\d{10}$/.test(val)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["identification"],
                message: "La cédula debe contener exactamente 10 dígitos numéricos",
              });
            }
          }
        })
    ),
    defaultValues: {
      identification: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      roles: ["CLIENT"],
    },
  });

  // Rellena o limpia el formulario cuando cambia editingPerson
  useEffect(() => {
    if (editingPerson) {
      reset({
        ...editingPerson,
        roles: editingPerson.roles.length ? editingPerson.roles : ["CLIENT"],
      });
    } else {
      reset({
        identification: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        roles: ["CLIENT"],
      });
    }
  }, [editingPerson, reset, open]);

  const onSubmit = async (data: CreatePersonInput) => {
    setError(null);

    let action;
    const isUpdate = !!editingPerson;

    if (isUpdate) {
      action = await updatePerson(editingPerson!.id ?? "", data);
    } else {
      action = await createPerson(data, tenantId);
    }

    if (action.success) {
      await onSuccess(isUpdate);
      onClose();
    } else {
      setError(action.error || "Ocurrió un error al guardar.");
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
                disabled={!watch("identificationType")}
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
            defaultValue={["CLIENT"]}
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
