import { z } from "zod";

export const CashSessionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  cashBoxId: z.string(),
  openedAt: z.coerce.date(),
  closedAt: z.coerce.date().nullable().optional(),
  initialAmount: z.number(),
  closingAmount: z.number().nullable().optional(),
  // Relations can be validated separately or omitted here
});

export type CashSession = z.infer<typeof CashSessionSchema>;
