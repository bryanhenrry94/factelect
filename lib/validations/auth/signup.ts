import z from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(2, "El nombre es obligatorio"),
    email: z.string().email("Correo electrónico inválido"),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(6, "La confirmación de la contraseña es obligatoria"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
  });

export type SignupData = z.infer<typeof signupSchema>;
