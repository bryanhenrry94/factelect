import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(),
  name: z.string().nullable().optional(),
  role: z.enum(["USER", "ADMIN"]), // Ajusta los valores según tu enum UserRole
  tenantId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
