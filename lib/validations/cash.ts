import { z } from "zod";

export const cashSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, "Name is required"),
  balance: z.number(),
  tenantId: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createCashSchema = cashSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCashSchema = cashSchema.partial().required({ id: true });

export type Cash = z.infer<typeof cashSchema>;
export type CreateCash = z.infer<typeof createCashSchema>;
export type UpdateCash = z.infer<typeof updateCashSchema>;
