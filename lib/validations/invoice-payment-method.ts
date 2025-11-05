import { z } from "zod";

export const invoicePaymentMethodSchema = z.object({
  id: z.string().cuid().optional(),
  invoiceId: z.string(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  term: z.number().int().positive().optional(),
  timeUnit: z.string().optional(),
  amount: z.number().positive("Amount must be greater than 0"),
});

export const createInvoicePaymentMethodSchema = invoicePaymentMethodSchema.omit(
  {
    id: true,
  }
);

export const updateInvoicePaymentMethodSchema = invoicePaymentMethodSchema
  .partial()
  .required({
    id: true,
  });

export type InvoicePaymentMethod = z.infer<typeof invoicePaymentMethodSchema>;
export type CreateInvoicePaymentMethod = z.infer<
  typeof createInvoicePaymentMethodSchema
>;
export type UpdateInvoicePaymentMethod = z.infer<
  typeof updateInvoicePaymentMethodSchema
>;
