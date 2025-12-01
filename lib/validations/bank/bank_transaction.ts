import { z } from "zod";

export const BankTransactionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  date: z.coerce.date(),
  description: z.string().nullable().optional(),
  amount: z.string(), // Use z.string() for Decimal, or z.number() if you convert to number
  reference: z.string().nullable().optional(),
  accountId: z.string(),
  matched: z.boolean().default(false),
});

export type BankTransaction = z.infer<typeof BankTransactionSchema>;
