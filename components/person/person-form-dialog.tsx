import { createPerson, updatePerson } from "@/actions";
import { getAccounts } from "@/actions/accounting/account";
import { identificationOptions } from "@/constants/identification";
import { notifyInfo } from "@/lib/notifications";
import { Account } from "@/lib/validations";
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
import React, { useEffect } from "react";
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
  const [accounts, setAccounts] = React.useState<Account[]>([]);

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
      personKind: "NATURAL",
      identificationType: "CEDULA",
      identification: "",
      firstName: "",
      lastName: "",
      businessName: "",
      commercialName: "",
      email: "",
      phone: "",
      address: "",
      roles: ["CLIENT"],
      accountPayableId: null,
      accountReceivableId: null,
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

  // Fetch accounts when dialog opens
  useEffect(() => {
    const fetchAccounts = async () => {
      const response = await getAccounts(tenantId);
      if (response.success && response.data) {
        setAccounts(response.data);
      }
    };
    fetchAccounts();
  }, [tenantId, open]);

  const onSubmit = async (data: CreatePersonInput) => {
    setError(null);

    console.log("Submitting person data:", data);

    const action = editingPerson
      ? await updatePerson(editingPerson.id ?? "", data)
      : await createPerson(data, tenantId);

    if (action.success) {
      notifyInfo(
        `Persona ${editingPerson ? "actualizada" : "creada"} correctamente`
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
                label="Tipo de Persona"
                {...register("personKind")}
                error={!!errors.personKind}
                helperText={errors.personKind?.message}
                value={watch("personKind") || "NATURAL"}
                fullWidth
                size="small"
              >
                <MenuItem value="NATURAL">NATURAL</MenuItem>
                <MenuItem value="LEGAL">JURÍDICA</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ md: 6 }} />
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                label="Tipo de Identificación"
                {...register("identificationType")}
                error={!!errors.identificationType}
                helperText={errors.identificationType?.message}
                value={watch("identificationType") || "CEDULA"}
                fullWidth
                size="small"
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
                size="small"
              />
            </Grid>
            {watch("personKind") === "LEGAL" ? (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Razón Social"
                    {...register("businessName")}
                    error={!!errors.businessName}
                    helperText={errors.businessName?.message}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Nombre Comercial"
                    {...register("commercialName")}
                    error={!!errors.commercialName}
                    helperText={errors.commercialName?.message}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Nombres"
                    {...register("firstName")}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Apellidos"
                    {...register("lastName")}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Correo electrónico"
                type="email"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Teléfono"
                {...register("phone")}
                fullWidth
                size="small"
              />
            </Grid>
            <TextField
              label="Dirección"
              {...register("address")}
              fullWidth
              size="small"
            />

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
                  size="small"
                >
                  {["CLIENT", "SUPPLIER", "SELLER"].map((role) => (
                    <MenuItem key={role} value={role}>
                      {getRoleLabel(role)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Typography variant="body2" color="text.secondary">
            Contabilidad
          </Typography>
          <Controller
            name="accountPayableId"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                label="Cuenta por Pagar"
                {...field}
                error={!!errors.accountPayableId}
                helperText={errors.accountPayableId?.message}
                fullWidth
                size="small"
                select
                value={field.value || ""}
                onChange={(e) => field.onChange(e)}
              >
                <MenuItem value={""}>Ninguna</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="accountReceivableId"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                label="Cuenta por Cobrar"
                {...field}
                error={!!errors.accountReceivableId}
                helperText={errors.accountReceivableId?.message}
                fullWidth
                size="small"
                select
                value={field.value || ""}
                onChange={(e) => field.onChange(e)}
              >
                <MenuItem value={""}>Ninguna</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.code} - {account.name}
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
