import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().cuid().optional(),
  type: z.enum(["INCOME", "EXPENSE"]), // Adjust based on your TransactionType enum
  method: z.enum(["CASH", "TRANSFER", "PETTY_CASH", "CREDIT_CARD"]), // Adjust based on your PaymentMethod enum
  issueDate: z.date(),
  reference: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tenantId: z.string(),
  personId: z.string(),
  cashId: z.string().nullable().optional(),
  bankAccountId: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
