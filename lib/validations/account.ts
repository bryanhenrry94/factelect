import { z } from "zod";

export const accountSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  accountType: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
  parentId: z.string().uuid().nullable().optional(),
  isAuxiliary: z.boolean().optional(),
  allowCustomer: z.boolean().optional(),
  allowSupplier: z.boolean().optional(),
  // Relaciones inversas y arrays pueden omitirse o representarse como empty arrays or omitted for validation
});

export const createAccountSchema = accountSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  balance: true,
});

export const updateAccountSchema = accountSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type Account = z.infer<typeof accountSchema>;
export type CreateAccount = z.infer<typeof createAccountSchema>;
export type UpdateAccount = z.infer<typeof updateAccountSchema>;
