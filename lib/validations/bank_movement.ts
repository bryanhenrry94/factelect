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
  bankAccountId: z.string(),
  type: BankMovementTypeEnum,
  amount: z.number(),
  description: z.string().optional(),
  accountId: z.string().optional(),
  createdAt: z.date(),
  // Relations can be validated separately or omitted if not needed here
});

export type BankMovement = z.infer<typeof BankMovementSchema>;
