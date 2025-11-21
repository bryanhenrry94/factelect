import { z } from "zod";

export const CashCountSchema = z.object({
  id: z.string(),
  cashSessionId: z.string(),
  denomination: z.number(),
  quantity: z.number().int(),
  total: z.number(),
  tenantId: z.string(),
});

export type CashCount = z.infer<typeof CashCountSchema>;
