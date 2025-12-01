import { z } from "zod";

export const CashSessionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  cashBoxId: z.string(),
  userId: z.string(),
  openedAt: z.date(),
  closedAt: z.date().nullable().optional(),
  initialAmount: z.number(),
  closingAmount: z.number().nullable().optional(),
  status: z.enum(["OPEN", "CLOSED", "PENDING"]),
  notes: z.string().nullable().optional(),
});

export const createCashSessionSchema = CashSessionSchema.omit({
  id: true,
  tenantId: true,
  userId: true,
  openedAt: true,
  closedAt: true,
  status: true,
});

export const updateCashSessionSchema = CashSessionSchema.partial();

export type CashSession = z.infer<typeof CashSessionSchema>;
export type CreateCashSession = z.infer<typeof createCashSessionSchema>;
export type UpdateCashSession = z.infer<typeof updateCashSessionSchema>;
