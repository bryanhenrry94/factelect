import { z } from "zod";

// Enum for BankMovementType (replace with actual values)
export const BankMovementTypeEnum = z.enum([
  "DEPOSIT",
  "WITHDRAWAL",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "FEE",
]);

export const BankMovementSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  bankAccountId: z.string().min(1, "La cuenta bancaria es obligatoria"),
  type: BankMovementTypeEnum,
  date: z.date(),
  amount: z.number().positive("El monto debe ser un número positivo"),
  description: z.string().optional(),
  reference: z.string().optional(),
  accountId: z.string().optional(),
  createdAt: z.date(),
  // Relations can be validated separately or omitted if not needed here
});

export const createBankMovementSchema = BankMovementSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export const bankMovementWithAccountSchema = BankMovementSchema.extend({
  account: z
    .object({
      id: z.string(),
      name: z.string(),
      number: z.string(),
    })
    .optional(),
});

export type CreateBankMovement = z.infer<typeof createBankMovementSchema>;
export type BankMovement = z.infer<typeof BankMovementSchema>;
export type BankMovementWithAccount = z.infer<
  typeof bankMovementWithAccountSchema
>;
