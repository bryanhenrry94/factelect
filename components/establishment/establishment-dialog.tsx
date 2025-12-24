"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";

import {
  createEstablishment,
  updateEstablishment,
} from "@/actions/establishment";
import { notifyError, notifyInfo } from "@/lib/notifications";
import {
  CreateEstablishment,
  Establishment,
} from "@/lib/validations/e-invoicing/establishment";

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
    defaultValues: {
      code: "",
      address: "",
    },
  });

  /**
   * 🔁 Reset al abrir / cambiar modo
   */
  useEffect(() => {
    if (establishmentSelected) {
      reset({
        code: establishmentSelected.code ?? "",
        address: establishmentSelected.address ?? "",
      });
    } else {
      reset({
        code: "",
        address: "",
      });
    }
  }, [establishmentSelected, reset]);

  /**
   * 💾 Crear / Actualizar
   */
  const onSubmit = async (data: CreateEstablishment) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró la información del usuario.");
        return;
      }

      const payload = {
        ...data,
        tenantId: session.user.tenantId,
      };

      const result = establishmentSelected
        ? await updateEstablishment(establishmentSelected.id!, payload)
        : await createEstablishment(session.user.tenantId, payload);

      if (result.success) {
        notifyInfo(
          establishmentSelected
            ? "Establecimiento actualizado correctamente"
            : "Establecimiento creado correctamente"
        );
        await onSuccess();
        onClose();
      } else {
        notifyError(result.error || "Error al guardar el establecimiento");
      }
    } catch (error) {
      console.error(error);
      notifyError("Ocurrió un error inesperado");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {establishmentSelected
              ? "Editar Establecimiento"
              : "Agregar Establecimiento"}
          </DialogTitle>
          <DialogDescription>
            {establishmentSelected
              ? "Actualiza la información del establecimiento."
              : "Agrega un nuevo establecimiento a tu base de datos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Código */}
          <div className="space-y-1">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              maxLength={3}
              placeholder="001"
              {...register("code", {
                required: "El código es obligatorio",
                minLength: {
                  value: 3,
                  message: "Debe tener 3 caracteres",
                },
                maxLength: {
                  value: 3,
                  message: "Debe tener 3 caracteres",
                },
              })}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>

          {/* Dirección */}
          <div className="space-y-1">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Av. Principal y Calle Secundaria"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-sm text-destructive">
                {errors.address.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : establishmentSelected
                ? "Actualizar"
                : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EstablishmentDialog;
