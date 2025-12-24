import { z } from "zod";

export const CashBoxSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "El nombre es obligatorio"),
  createdAt: z.date(),
  updatedAt: z.date(),
  accountId: z.string().nullable().optional(),
  tenantId: z.string(),
  isActive: z.boolean(),
});

export const createCashBoxSchema = CashBoxSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCashBoxSchema = createCashBoxSchema.partial();

export type CashBox = z.infer<typeof CashBoxSchema>;
export type CreateCashBox = z.infer<typeof createCashBoxSchema>;
export type UpdateCashBox = z.infer<typeof updateCashBoxSchema>;
