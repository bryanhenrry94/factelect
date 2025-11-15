import { z } from "zod";

// Base Payment schema
export const paymentSchema = z.object({
  id: z.string().cuid(),
  invoiceId: z.string(),
  amount: z.number().positive(),
  date: z.date(),
  method: z.enum([
    "CASH",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "CHECK",
    "OTHER",
  ]),
  createdAt: z.date(),
  tenantId: z.string(),
});

// Schema for creating a new payment
export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, "El ID de la factura es obligatorio"),
  amount: z.number().positive("El monto debe ser positivo"),
  date: z.date().optional(),
  method: z.enum([
    "CASH",
    "CREDIT_CARD",
    "DEBIT_CARD",
    "BANK_TRANSFER",
    "CHECK",
    "OTHER",
  ]),
  tenantId: z.string().min(1, "El ID del inquilino es obligatorio"),
});

// Schema for updating a payment
export const updatePaymentSchema = z.object({
  amount: z.number().positive("El monto debe ser positivo").optional(),
  date: z.date().optional(),
  method: z
    .enum([
      "CASH",
      "CREDIT_CARD",
      "DEBIT_CARD",
      "BANK_TRANSFER",
      "CHECK",
      "OTHER",
    ])
    .optional(),
});

// Type exports
export type Payment = z.infer<typeof paymentSchema>;
export type CreatePayment = z.infer<typeof createPaymentSchema>;
export type UpdatePayment = z.infer<typeof updatePaymentSchema>;
