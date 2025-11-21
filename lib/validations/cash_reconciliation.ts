import { z } from "zod";

export const CashReconciliationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  cashSessionId: z.string(),
  expectedAmount: z.number(),
  actualAmount: z.number(),
  difference: z.number(),
});

export type CashReconciliation = z.infer<typeof CashReconciliationSchema>;
