import { z } from "zod";

export const BankTransferSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),

  fromAccountId: z.string().min(1, "La cuenta de origen es requerida"),
  toAccountId: z.string().min(1, "La cuenta de destino es requerida"),

  amount: z.number().positive("El monto debe ser un número positivo"),
  date: z.date(),

  description: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),

  movementOutId: z.string(),
  movementInId: z.string(),

  createdAt: z.date(),
});

export const bankTransferWithAccountSchema = BankTransferSchema.extend({
  fromAccount: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      accountNumber: z.string(),
    })
    .optional()
    .nullable(),
  toAccount: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      accountNumber: z.string(),
    })
    .optional()
    .nullable(),
});

export const createBankTransferSchema = BankTransferSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export const updateBankTransferSchema = BankTransferSchema.partial();

export type BankTransfer = z.infer<typeof BankTransferSchema>;
export type BankTransferWithAccount = z.infer<
  typeof bankTransferWithAccountSchema
>;

export type CreateBankTransfer = z.infer<typeof createBankTransferSchema>;
export type UpdateBankTransfer = z.infer<typeof updateBankTransferSchema>;
