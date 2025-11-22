import { z } from "zod";

export const BankAccountSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  bankName: z.string().min(1, "El nombre de la cuenta es obligatorio"),
  accountNumber: z.string().min(1, "El número de cuenta es obligatorio"),
  alias: z.string().nullable().optional(),
  type: z.enum(["CURRENT", "SAVINGS", "CREDIT", "OTHER"]),
  accountId: z.string().nullable().optional(),
  // account: Account? -- usually validated separately
  createdAt: z.date(),
  updatedAt: z.date(),
  // tenant, movements, transaction -- usually validated separately
});

export const createBankAccountSchema = BankAccountSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateBankAccount = z.infer<typeof createBankAccountSchema>;
export type BankAccount = z.infer<typeof BankAccountSchema>;
