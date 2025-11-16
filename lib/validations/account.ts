import { z } from "zod";

export const accountSchema = z.object({
  id: z.string().cuid().optional(),
  tenantId: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["BANK", "CASH", "CREDIT_CARD"]), // Ajusta según tu enum AccountType
  balance: z.number(),
  currency: z.string(),
  bank: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  last4: z.string().length(4).nullable().optional(),
  createdAt: z.date().optional(),
});

export const createAccountSchema = accountSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  balance: true,
});

export const updateAccountSchema = accountSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type Account = z.infer<typeof accountSchema>;
export type CreateAccount = z.infer<typeof createAccountSchema>;
export type UpdateAccount = z.infer<typeof updateAccountSchema>;
