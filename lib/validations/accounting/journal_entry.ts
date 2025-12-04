import { z } from "zod";
import { createJournalEntryLineSchema } from "./journal-entry-line";

export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  date: z.date(),
  description: z.string().optional(),
  type: z.enum(["JOURNAL", "ADJUSTMENT", "CLOSING"]),
  documentType: z
    .enum(["INVOICE", "BILL", "RECEIPT", "PAYMENT", "COLLECTION", "OTHER"])
    .optional(),
  documentId: z.string().optional(),
  lines: z.array(createJournalEntryLineSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createJournalEntrySchema = JournalEntrySchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});
export const updateJournalEntrySchema = JournalEntrySchema.partial();

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type CreateJournalEntry = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntry = z.infer<typeof updateJournalEntrySchema>;
