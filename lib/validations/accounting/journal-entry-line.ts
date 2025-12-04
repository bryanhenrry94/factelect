import { z } from "zod";

// Zod schema for LedgerEntry
export const JournalEntryLine = z.object({
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

export const createJournalEntryLineSchema = JournalEntryLine.omit({
  id: true,
  tenantId: true,
  journalEntryId: true,
  createdAt: true,
});

export const updateJournalEntryLineSchema = JournalEntryLine.partial();

export type JournalEntryLine = z.infer<typeof JournalEntryLine>;
export type CreateJournalEntryLine = z.infer<
  typeof createJournalEntryLineSchema
>;
export type UpdateJournalEntryLine = z.infer<
  typeof updateJournalEntryLineSchema
>;
