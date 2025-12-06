import { z } from "zod";

export const DocumentItemSchema = z.object({
  id: z.cuid().optional(),
  documentId: z.string(),
  productId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  tax: z.enum([
    "IVA_0",
    "IVA_5",
    "IVA_12",
    "IVA_14",
    "IVA_15",
    "NO_IVA",
    "EXENTO_IVA",
  ]),
  taxAmount: z.number().min(0),
  discountRate: z.number().min(0).max(100),
  discountAmount: z.number().min(0),
  subtotal: z.number().positive(),
  total: z.number().positive(),
});

export const createDocumentItemSchema = DocumentItemSchema.omit({
  id: true,
  documentId: true,
});

export const updateDocumentItemSchema = createDocumentItemSchema.partial();

export type DocumentItem = z.infer<typeof DocumentItemSchema>;
export type CreateDocumentItem = z.infer<typeof createDocumentItemSchema>;
export type UpdateDocumentItem = z.infer<typeof updateDocumentItemSchema>;
