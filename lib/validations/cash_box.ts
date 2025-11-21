import { z } from "zod";

export const CashBoxSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  accountId: z.string().nullable().optional(),
  tenantId: z.string(),
  // Relations can be validated separately if needed:
  // account: z.lazy(() => AccountSchema).nullable().optional(),
  // tenant: z.lazy(() => TenantSchema),
  // cashSession: z.array(z.lazy(() => CashSessionSchema)),
  // transaction: z.array(z.lazy(() => TransactionSchema)),
});

export type CashBox = z.infer<typeof CashBoxSchema>;
