import { z } from "zod";

export const CostCenterSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  code: z.string(),
  name: z.string(),
  // ledgerEntries is an array of LedgerEntry, define LedgerEntrySchema separately if needed
  ledgerEntries: z.array(z.any()), // Replace z.any() with LedgerEntrySchema when available
});

export type CostCenter = z.infer<typeof CostCenterSchema>;
