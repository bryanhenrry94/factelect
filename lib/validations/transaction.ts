import { z } from "zod";
import { createTransactionDocumentSchema } from "./transaction-document";

const TransactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);
const PaymentMethodEnum = z.enum([
  "CASH",
  "TRANSFER",
  "PETTY_CASH",
  "CREDIT_CARD",
]);

export const transactionSchema = z.object({
  id: z.cuid(),
  tenantId: z.string(),
  personId: z.string(),
  type: TransactionTypeEnum,
  method: PaymentMethodEnum,
  amount: z.number(),
  issueDate: z.date(),
  reference: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  documents: z.array(createTransactionDocumentSchema),
  reconciled: z.boolean().optional(),
  reconciledAt: z.date().nullable().optional(),
  bankAccountId: z.string().nullable().optional(),
  userId: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createTransactionSchema = transactionSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
  })
  .superRefine((data, ctx) => {
    if (data.method === "TRANSFER") {
      if (!data.bankAccountId) {
        ctx.addIssue({
          path: ["bankAccountId"],
          message:
            "La cuenta bancaria es obligatoria cuando el método es Transferencia.",
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

export type TransactionInput = z.infer<typeof transactionSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
