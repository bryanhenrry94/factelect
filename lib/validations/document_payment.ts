import { z } from "zod";

// Base Payment schema
export const documentPaymentSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string(),
  paymentMethod: z.string(),
  amount: z.number().positive(),
  term: z.number().int().optional(),
  termUnit: z.string().optional(),
  createdAt: z.date(),
});

// Schema for creating a new payment
export const createDocumentPaymentSchema = z.object({
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
export const updateDocumentPaymentSchema = z.object({
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
export type Payment = z.infer<typeof documentPaymentSchema>;
export type CreatePayment = z.infer<typeof createDocumentPaymentSchema>;
export type UpdatePayment = z.infer<typeof updateDocumentPaymentSchema>;
