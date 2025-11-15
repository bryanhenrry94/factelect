import { z } from "zod";

export const bankAccountSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, "Nombre es obligatorio"),
  accountNumber: z.string().min(1, "Número de cuenta es obligatorio"),
  accountType: z.string().min(1, "Tipo de cuenta es obligatorio"),
  bankName: z.string().min(1, "Nombre del banco es obligatorio"),
  balance: z.number(),
  tenantId: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createBankAccountSchema = bankAccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBankAccountSchema = bankAccountSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type BankAccount = z.infer<typeof bankAccountSchema>;
export type CreateBankAccount = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccount = z.infer<typeof updateBankAccountSchema>;
