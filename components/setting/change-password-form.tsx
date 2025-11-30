"use client";

import { changeUserPassword } from "@/actions/user";
import { AlertService } from "@/lib/alerts";
import { notifyError, notifyInfo } from "@/lib/notifications";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface ChangePasswordFormProps {
  userId: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ userId }) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const toggleShow = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

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
      AlertService.showError("Error al actualizar la contraseña");
      console.error(error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Cambiar la Contraseña
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Para cambiar tu contraseña, confirma aquí.
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxWidth: 400,
          mt: 2,
        }}
      >
        {/* Contraseña actual */}
        <TextField
          fullWidth
          label="Contraseña Actual"
          type={showPasswords.current ? "text" : "password"}
          {...register("currentPassword", {
            required: "La contraseña actual es obligatoria",
          })}
          error={!!errors.currentPassword}
          helperText={errors.currentPassword?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => toggleShow("current")} edge="end">
                  {showPasswords.current ? <EyeOff /> : <Eye />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Nueva contraseña */}
        <TextField
          fullWidth
          label="Nueva Contraseña"
          type={showPasswords.new ? "text" : "password"}
          {...register("newPassword", {
            required: "La nueva contraseña es obligatoria",
            minLength: {
              value: 8,
              message: "Debe tener al menos 8 caracteres",
            },
          })}
          error={!!errors.newPassword}
          helperText={
            errors.newPassword?.message ||
            "La contraseña debe tener al menos 8 caracteres."
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => toggleShow("new")} edge="end">
                  {showPasswords.new ? <EyeOff /> : <Eye />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Confirmar contraseña */}
        <TextField
          fullWidth
          label="Confirmar Nueva Contraseña"
          type={showPasswords.confirm ? "text" : "password"}
          {...register("confirmPassword", {
            required: "Debe confirmar la nueva contraseña",
            validate: (value) =>
              value === watch("newPassword") || "Las contraseñas no coinciden",
          })}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => toggleShow("confirm")} edge="end">
                  {showPasswords.confirm ? <EyeOff /> : <Eye />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          sx={{ alignSelf: "flex-start" }}
        >
          {isSubmitting ? "Actualizando..." : "Actualizar Contraseña"}
        </Button>
      </Box>
    </Box>
  );
};

export default ChangePasswordForm;
