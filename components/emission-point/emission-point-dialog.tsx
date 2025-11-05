import {
  createEmissionPoint,
  updateEmissionPoint,
} from "@/app/actions/emission-point";
import { AlertService } from "@/lib/alerts";
import {
  CreateEmissionPoint,
  createEmissionPointSchema,
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
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface EmissionPointDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  editingData: EmissionPoint | null;
  sriConfigId: string;
  establishments: Establishment[];
}

const EmissionPointDialog: React.FC<EmissionPointDialogProps> = ({
  open,
  onClose,
  onSuccess,
  editingData,
  sriConfigId,
  establishments,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateEmissionPoint>({
    // resolver: zodResolver(createEmissionPointSchema),
    defaultValues: {
      establishmentId: editingData?.establishmentId ?? "",
      code: editingData?.code ?? "",
      description: editingData?.description ?? "",
      currentInvoiceSequence: editingData?.currentInvoiceSequence ?? 1,
      isActive: editingData?.isActive ?? true,
    },
  });

  // 🔁 Reset del formulario al cambiar entre modo "editar" y "crear"
  useEffect(() => {
    reset({
      establishmentId: editingData?.establishmentId ?? "",
      code: editingData?.code ?? "",
      description: editingData?.description ?? "",
      currentInvoiceSequence: editingData?.currentInvoiceSequence ?? 1,
      isActive: editingData?.isActive ?? true,
    });
  }, [editingData, reset]);

  // 💾 Crear o actualizar punto de emisión
  const onSubmit = async (data: CreateEmissionPoint) => {
    try {
      const formattedData = {
        ...data,
        sriConfigId,
        currentInvoiceSequence: Number(data.currentInvoiceSequence),
      };

      const response = editingData
        ? await updateEmissionPoint(editingData.id!, formattedData)
        : await createEmissionPoint(formattedData);

      if (response.success) {
        AlertService.showSuccess(
          editingData
            ? "Punto de emisión actualizado correctamente"
            : "Punto de emisión creado correctamente"
        );
        await onSuccess();
        onClose();
      } else {
        AlertService.showError(
          response.error || "Error al guardar el punto de emisión"
        );
      }
    } catch (error) {
      console.error(error);
      AlertService.showError("Ocurrió un error inesperado al guardar");
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

            {/* 🔸 Secuencia */}
            <Controller
              name="currentInvoiceSequence"
              control={control}
              rules={{
                required: "La secuencia es obligatoria",
                min: { value: 1, message: "Debe ser mayor o igual a 1" },
              }}
              render={({ field }) => (
                <TextField
                  type="number"
                  label="Secuencia Actual de Factura"
                  {...field}
                  error={!!errors.currentInvoiceSequence}
                  helperText={errors.currentInvoiceSequence?.message}
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
