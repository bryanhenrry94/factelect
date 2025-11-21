import { z } from "zod";

export const BankAccountSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  alias: z.string().nullable().optional(),
  type: z.enum(["CURRENT", "SAVINGS", "CREDIT", "OTHER"]),
  currency: z.string(),
  accountId: z.string().nullable().optional(),
  // account: Account? -- usually validated separately
  createdAt: z.date(),
  updatedAt: z.date(),
  // tenant, movements, transaction -- usually validated separately
});

export type BankAccount = z.infer<typeof BankAccountSchema>;
