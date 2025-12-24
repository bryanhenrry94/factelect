"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { changeUserPassword } from "@/actions/setting/user";
import { notifyError, notifyInfo } from "@/lib/notifications";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface ChangePasswordFormProps {
  userId: string;
}

export default function ChangePasswordForm({
  userId,
}: ChangePasswordFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>();

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const toggle = (key: keyof typeof show) =>
    setShow((prev) => ({ ...prev, [key]: !prev[key] }));

  const onSubmit = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      notifyError("Las contraseñas no coinciden");
      return;
    }

    try {
      const result = await changeUserPassword(
        userId,
        data.currentPassword,
        data.newPassword
      );

      if (result.success) {
        notifyInfo("Contraseña actualizada con éxito");
        reset();
      } else {
        notifyError(result.error || "Error al actualizar la contraseña");
      }
    } catch (error) {
      notifyError("Error al actualizar la contraseña");
      console.error(error);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>
          Confirma tu contraseña actual y define una nueva
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Contraseña actual */}
          <div className="space-y-1">
            <Label>Contraseña actual</Label>
            <div className="relative">
              <Input
                type={show.current ? "text" : "password"}
                {...register("currentPassword", {
                  required: "La contraseña actual es obligatoria",
                })}
              />
              <button
                type="button"
                onClick={() => toggle("current")}
                className="absolute right-2 top-2.5 text-muted-foreground"
              >
                {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-1">
            <Label>Nueva contraseña</Label>
            <div className="relative">
              <Input
                type={show.new ? "text" : "password"}
                {...register("newPassword", {
                  required: "La nueva contraseña es obligatoria",
                  minLength: {
                    value: 8,
                    message: "Debe tener al menos 8 caracteres",
                  },
                })}
              />
              <button
                type="button"
                onClick={() => toggle("new")}
                className="absolute right-2 top-2.5 text-muted-foreground"
              >
                {show.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1">
            <Label>Confirmar nueva contraseña</Label>
            <div className="relative">
              <Input
                type={show.confirm ? "text" : "password"}
                {...register("confirmPassword", {
                  required: "Debe confirmar la nueva contraseña",
                  validate: (value) =>
                    value === watch("newPassword") ||
                    "Las contraseñas no coinciden",
                })}
              />
              <button
                type="button"
                onClick={() => toggle("confirm")}
                className="absolute right-2 top-2.5 text-muted-foreground"
              >
                {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
