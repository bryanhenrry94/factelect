import { z } from "zod";

// Enum definitions (replace with your actual enums if imported)
export enum EntryType {
  JOURNAL = "JOURNAL",
  ADJUSTMENT = "ADJUSTMENT", // Ajuste
  CLOSING = "CLOSING",
}

export enum DocumentType {
  INVOICE = "INVOICE", // Factura
  BILL = "BILL", // Boleta
  RECEIPT = "RECEIPT", // Recibo
  PAYMENT = "PAYMENT", // Pago
  COLLECTION = "COLLECTION", // Cobro
  OTHER = "OTHER",
}

export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  entryNumber: z.number().int(),
  date: z.coerce.date(),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(EntryType).default(EntryType.JOURNAL),
  documentType: z.nativeEnum(DocumentType).optional().nullable(),
  documentId: z.string().optional().nullable(),
  // entries: z.array(LedgerEntrySchema), // Uncomment and define LedgerEntrySchema if needed
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
