import { z } from "zod";
import { createTransactionDocumentSchema } from "./transaction-document";

export const transactionSchema = z.object({
  id: z.string().cuid().optional(),
  type: z.enum(["INCOME", "EXPENSE"]), // Adjust based on your TransactionType enum
  method: z.enum(["CASH", "TRANSFER", "PETTY_CASH", "CREDIT_CARD"]), // Adjust based on your PaymentMethod enum
  issueDate: z.date(),
  reference: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tenantId: z.string(),
  personId: z.string(),
  accountId: z.string(),
  documents: z.array(createTransactionDocumentSchema).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createTransactionSchema = transactionSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
