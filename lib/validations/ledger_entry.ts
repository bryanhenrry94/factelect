import { z } from "zod";

// Zod schema for LedgerEntry
export const LedgerEntrySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  journalEntryId: z.string(),
  accountId: z.string(),
  debit: z.number(),
  credit: z.number(),
  personId: z.string().nullable().optional(),
  costCenterId: z.string().nullable().optional(),
  createdAt: z.date(),
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
