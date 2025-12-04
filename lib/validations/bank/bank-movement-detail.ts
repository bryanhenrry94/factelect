import { z } from "zod";

export const BankMovementDetailSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  bankMovementId: z.string(),
  accountId: z.string(),
  costCenterId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().positive("El monto debe ser un número positivo"),
  createdAt: z.date(),
});

export const createBankMovementDetailSchema = BankMovementDetailSchema.omit({
  id: true,
  tenantId: true,
  bankMovementId: true,
  createdAt: true,
});

export type BankMovementDetail = z.infer<typeof BankMovementDetailSchema>;
export type CreateBankMovementDetail = z.infer<
  typeof createBankMovementDetailSchema
>;
