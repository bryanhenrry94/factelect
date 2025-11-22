import { z } from "zod";

export const CashMovementSchema = z.object({
  id: z.string(),
  cashSessionId: z.string(),
  type: z.enum(["IN", "OUT"]),
  category: z.enum([
    "SALE",
    "PURCHASE",
    "PETTY_CASH",
    "ADVANCE",
    "REFUND",
    "TRANSFER",
    "OTHER",
  ]),
  amount: z
    .number()
    .positive({ message: "El monto debe ser un número positivo" }),
  description: z.string().nullable().optional(),
  createdAt: z.date(),
  accountId: z.string().nullable().optional(),
  tenantId: z.string(),
});

export const createCashMovementSchema = CashMovementSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export const updateCashMovementSchema = createCashMovementSchema.partial();

export type CreateCashMovement = z.infer<typeof createCashMovementSchema>;
export type UpdateCashMovement = z.infer<typeof updateCashMovementSchema>;
export type CashMovement = z.infer<typeof CashMovementSchema>;
