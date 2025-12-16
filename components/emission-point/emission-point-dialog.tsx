"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";

import {
  createEmissionPoint,
  updateEmissionPoint,
} from "@/actions/emission-point";
import { getEstablishments } from "@/actions";
import {
  CreateEmissionPoint,
  EmissionPoint,
} from "@/lib/validations/emission-point";
import { Establishment } from "@/lib/validations/establishment";
import { notifyError, notifyInfo } from "@/lib/notifications";

/* shadcn */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
  const { data: session } = useSession();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateEmissionPoint>({
    defaultValues: {
      establishmentId: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  /**
   * 🔁 Reset formulario al cambiar entre crear / editar
   */
  useEffect(() => {
    reset({
      establishmentId: editingData?.establishmentId ?? "",
      code: editingData?.code ?? "",
      description: editingData?.description ?? "",
      isActive: editingData?.isActive ?? true,
    });
  }, [editingData, reset]);

  /**
   * 📥 Cargar establecimientos
   */
  useEffect(() => {
    const fetchEstablishments = async () => {
      if (!session?.user?.tenantId) return;

      const result = await getEstablishments(session.user.tenantId);
      if (result.success) {
        setEstablishments(result.data || []);
      }
    };

    if (open) fetchEstablishments();
  }, [open, session?.user?.tenantId]);

  /**
   * 💾 Guardar
   */
  const onSubmit = async (data: CreateEmissionPoint) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId.");
        return;
      }

      const payload = {
        ...data,
        tenantId: session.user.tenantId,
      };

      const response = editingData
        ? await updateEmissionPoint(editingData.id!, payload)
        : await createEmissionPoint(payload);

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
      notifyError("Ocurrió un error inesperado");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <DialogHeader>
            <DialogTitle>
              {editingData
                ? "Editar Punto de Emisión"
                : "Agregar Punto de Emisión"}
            </DialogTitle>
            <DialogDescription>
              {editingData
                ? "Actualiza la información del punto de emisión."
                : "Agrega un nuevo punto de emisión a tu base de datos."}
            </DialogDescription>
          </DialogHeader>

          {/* Establecimiento */}
          <div className="space-y-1">
            <Label>Establecimiento</Label>
            <Controller
              name="establishmentId"
              control={control}
              rules={{ required: "El establecimiento es obligatorio" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un establecimiento" />
                  </SelectTrigger>
                  <SelectContent>
                    {establishments.map((est) => (
                      <SelectItem key={est.id} value={est.id || ""}>
                        {est.code} - {est.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.establishmentId && (
              <p className="text-sm text-destructive">
                {errors.establishmentId.message}
              </p>
            )}
          </div>

          {/* Código */}
          <div className="space-y-1">
            <Label>Punto de Emisión</Label>
            <Controller
              name="code"
              control={control}
              rules={{
                required: "El punto de emisión es obligatorio",
                minLength: { value: 3, message: "Debe tener 3 dígitos" },
                maxLength: { value: 3, message: "Debe tener 3 dígitos" },
              }}
              render={({ field }) => <Input placeholder="001" {...field} />}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="Caja principal"
                  {...field}
                  value={field.value || ""}
                />
              )}
            />
          </div>

          {/* Activo */}
          <div className="flex items-center space-x-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label>Activo</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingData ? "Actualizar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmissionPointDialog;
