import { z } from "zod";
import {
  createJournalEntryLineSchema,
  journalEntryLineResponseSchema,
} from "./journal-entry-line";

export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  date: z.date(),
  description: z.string().optional(),
  type: z.enum([
    "PURCHASE", // Compra
    "SALE", // Venta
    "DEPOSIT", // Depósito
    "INVENTORY", // Inventario
    "WITHHOLDING", // Retención
    "ENTRY", // Asiento
    "INCOME", // Ingreso
    "EXPENSE", // Gasto
    "AUTOMATIC_CLOSING", // Cierre automático
    "PAYROLL", // Nómina
    "OTHER",
  ]),
  sourceType: z
    .enum([
      "DOCUMENT",
      "INVENTORY_MOVEMENT",
      "BANK_MOVEMENT",
      "CASH_MOVEMENT",
      "MANUAL_ENTRY",
    ])
    .optional(),
  sourceId: z.string().optional(),
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
export const journalEntryResponseSchema = JournalEntrySchema.extend({
  lines: z.array(journalEntryLineResponseSchema),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JournalEntryResponse = z.infer<typeof journalEntryResponseSchema>;
export type CreateJournalEntry = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntry = z.infer<typeof updateJournalEntrySchema>;
