import { z } from "zod";

export const transactionDocumentSchema = z.object({
  id: z.string().cuid().optional(),
  transactionId: z.string(),
  documentId: z.string(),
  amount: z.number(),
  tenantId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createTransactionDocumentSchema = transactionDocumentSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export type TransactionDocumentInput = z.infer<
  typeof transactionDocumentSchema
>;
export type CreateTransactionDocumentInput = z.infer<
  typeof createTransactionDocumentSchema
>;
