import { useEffect, useState } from "react";
import {
  createEmissionPoint,
  updateEmissionPoint,
} from "@/app/actions/emission-point";
import {
  CreateEmissionPoint,
  EmissionPoint,
} from "@/lib/validations/emission-point";
import { Establishment } from "@/lib/validations/establishment";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useSession } from "next-auth/react";
import { getEstablishments } from "@/app/actions";
import { notifyError, notifyInfo } from "@/lib/notifications";

interface EmissionPointDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingData: EmissionPoint | null;
}

const EmissionPointDialog: React.FC<EmissionPointDialogProps> = ({
  open,
  onClose,
  onSuccess,
  editingData,
}) => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const { data: session } = useSession();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateEmissionPoint>({
    defaultValues: {
      establishmentId: editingData?.establishmentId ?? "",
      code: editingData?.code ?? "",
      description: editingData?.description ?? "",
      isActive: editingData?.isActive ?? true,
    },
  });

  // 🔁 Reset del formulario al cambiar entre modo "editar" y "crear"
  useEffect(() => {
    reset({
      establishmentId: editingData?.establishmentId ?? "",
      code: editingData?.code ?? "",
      description: editingData?.description ?? "",
      isActive: editingData?.isActive ?? true,
    });
  }, [editingData, reset]);

  useEffect(() => {
    const fetchEstablishments = async () => {
      if (!session?.user?.tenantId) return;
      try {
        const response = await getEstablishments(session.user.tenantId);
        if (response.success) {
          setEstablishments(response.data || []);
        } else {
          setEstablishments([]);
        }
      } catch (error) {
        console.error("Error fetching establishments:", error);
      }
    };

    fetchEstablishments();
  }, [open, session?.user?.tenantId]);

  const onSubmit = async (data: CreateEmissionPoint) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId en la sesión.");
        return;
      }

      const formattedData = {
        ...data,
        tenantId: session.user.tenantId,
      };

      const response = editingData
        ? await updateEmissionPoint(editingData.id!, formattedData)
        : await createEmissionPoint(formattedData);

      if (response.success) {
        notifyInfo(
          editingData
            ? "Punto de emisión actualizado correctamente"
            : "Punto de emisión creado correctamente"
        );
        await onSuccess();
        onClose();
      } else {
        notifyError(response.error || "Error al guardar el punto de emisión");
      }
    } catch (error) {
      console.error(error);
      notifyError("Ocurrió un error inesperado al guardar el punto de emisión");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>
          {editingData ? "Editar Punto de Emisión" : "Agregar Punto de Emisión"}
        </DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {editingData
              ? "Actualiza la información del punto de emisión."
              : "Agrega un nuevo punto de emisión a tu base de datos."}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* 🔸 Establecimiento */}
            <Controller
              name="establishmentId"
              control={control}
              rules={{ required: "El establecimiento es obligatorio" }}
              render={({ field }) => (
                <TextField
                  select
                  label="Establecimiento"
                  {...field}
                  error={!!errors.establishmentId}
                  helperText={errors.establishmentId?.message}
                  fullWidth
                >
                  {establishments.map((est) => (
                    <MenuItem key={est.id} value={est.id}>
                      {est.code} - {est.address}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* 🔸 Código */}
            <Controller
              name="code"
              control={control}
              rules={{
                required: "El punto de emisión es obligatorio",
                minLength: { value: 3, message: "Debe tener 3 dígitos" },
                maxLength: { value: 3, message: "Debe tener 3 dígitos" },
              }}
              render={({ field }) => (
                <TextField
                  label="Punto de Emisión"
                  {...field}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  fullWidth
                />
              )}
            />

            {/* 🔸 Descripción */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Descripción"
                  {...field}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  fullWidth
                />
              )}
            />

            {/* 🔸 Activo */}
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="Activo"
                />
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {editingData ? "Actualizar" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EmissionPointDialog;
