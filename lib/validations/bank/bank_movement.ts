import { z } from "zod";
import { createBankMovementDetailSchema } from "./bank-movement-detail";

export const BankMovementTypeEnum = z.enum(["IN", "OUT"]);

export const BankMovementSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  bankAccountId: z.string().min(1, "La cuenta bancaria es obligatoria"),
  type: BankMovementTypeEnum,
  date: z.date(),
  reference: z.string().optional(),
  transactionId: z.string().optional(),
  amount: z.number().positive("El monto debe ser un número positivo"),
  description: z.string().optional(),
  journalEntryId: z.string().optional(),
  journalEntry: z.any().optional(), // Replace z.any() with a proper schema if available
  createdAt: z.date(),
  details: z.array(createBankMovementDetailSchema).optional(), // Replace z.any() with BankMovementDetail schema if available
  bankTransfersOut: z.array(z.any()).optional(), // Replace z.any() with BankTransfer schema if available
  bankTransfersIn: z.array(z.any()).optional(), // Replace z.any() with BankTransfer schema if available
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
