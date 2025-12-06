import { z } from "zod";

export const documentPaymentSchema = z.object({
  id: z.uuid(),
  documentId: z.string(),
  paymentMethod: z.string(),
  amount: z.number().positive(),
  term: z.number().int().optional(),
  termUnit: z.string().optional(),
  createdAt: z.date(),
});

export const createDocumentPaymentSchema = documentPaymentSchema.omit({
  id: true,
  documentId: true,
  createdAt: true,
});

export const updateDocumentPaymentSchema = documentPaymentSchema.partial();

export type DocumentPayment = z.infer<typeof documentPaymentSchema>;
export type CreateDocumentPayment = z.infer<typeof createDocumentPaymentSchema>;
export type UpdateDocumentPayment = z.infer<typeof updateDocumentPaymentSchema>;
