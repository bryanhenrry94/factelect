import {
  createEstablishment,
  updateEstablishment,
} from "@/app/actions/establishment";
import { AlertService } from "@/lib/alerts";
import {
  CreateEstablishment,
  Establishment,
} from "@/lib/validations/establishment";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface EstablishmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  establishmentSelected: Establishment | null;
}

const EstablishmentDialog: React.FC<EstablishmentDialogProps> = ({
  open,
  onClose,
  onSuccess,
  establishmentSelected,
}) => {
  const { data: session } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateEstablishment>({
    // resolver: zodResolver(createEstablishmentSchema),
    defaultValues: {
      tenantId: establishmentSelected?.tenantId ?? "",
      code: establishmentSelected?.code ?? "",
      address: establishmentSelected?.address ?? "",
    },
  });

  // 🔁 Rellena o limpia el formulario al cambiar el modo (editar o crear)
  useEffect(() => {
    if (establishmentSelected) {
      reset({
        tenantId: establishmentSelected.tenantId ?? "",
        code: establishmentSelected.code ?? "",
        address: establishmentSelected.address ?? "",
      });
    } else {
      reset({
        tenantId: "",
        code: "",
        address: "",
      });
    }
  }, [establishmentSelected, reset]);

  // 💾 Acción de crear o actualizar
  const onSubmit = async (data: CreateEstablishment) => {
    try {
      if (!session?.user?.tenantId) {
        AlertService.showError("No se encontró la información del usuario.");
        return;
      }

      const formattedData = { ...data, tenantId: session.user.tenantId };

      const response = establishmentSelected
        ? await updateEstablishment(establishmentSelected.id!, formattedData)
        : await createEstablishment(formattedData);

      if (response.success) {
        AlertService.showSuccess(
          establishmentSelected
            ? "Establecimiento actualizado correctamente"
            : "Establecimiento creado correctamente"
        );
        await onSuccess();
        onClose();
      } else {
        AlertService.showError(
          response.error || "Error al guardar el establecimiento"
        );
        // setError(response.error || "Error al guardar el establecimiento");
      }
    } catch (err: any) {
      console.error(err);
      // setError("Ocurrió un error inesperado al guardar el establecimiento");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>
          {establishmentSelected
            ? "Editar Establecimiento"
            : "Agregar Establecimiento"}
        </DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {establishmentSelected
              ? "Actualiza la información del establecimiento."
              : "Agrega un nuevo establecimiento a tu base de datos."}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Código"
              {...register("code", {
                required: "El código es obligatorio",
                maxLength: 3,
                minLength: 3,
              })}
              error={!!errors.code}
              helperText={errors.code?.message}
              fullWidth
            />

            <TextField
              label="Dirección"
              {...register("address")}
              error={!!errors.address}
              helperText={errors.address?.message}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {establishmentSelected ? "Actualizar" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EstablishmentDialog;
