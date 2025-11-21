import { z } from "zod";

export const CashMovementSchema = z.object({
  id: z.string(),
  cashSessionId: z.string(),
  type: z.enum(["IN", "OUT"]),
  amount: z.number(),
  description: z.string().nullable().optional(),
  createdAt: z.date(),
  accountId: z.string().nullable().optional(),
  tenantId: z.string(),
});

export type CashMovement = z.infer<typeof CashMovementSchema>;
