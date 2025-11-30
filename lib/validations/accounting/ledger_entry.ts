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

export const createLedgerEntrySchema = LedgerEntrySchema.omit({
  id: true,
  tenantId: true,
  journalEntryId: true,
  createdAt: true,
});

export const updateLedgerEntrySchema = LedgerEntrySchema.partial();

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
export type CreateLedgerEntry = z.infer<typeof createLedgerEntrySchema>;
export type UpdateLedgerEntry = z.infer<typeof updateLedgerEntrySchema>;
