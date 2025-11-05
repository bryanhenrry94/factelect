import { z } from "zod";

export const invoiceItemSchema = z.object({
  id: z.string().cuid().optional(),
  invoiceId: z.string(),
  productId: z.string(),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().positive(),
  tax: z.enum([
    "IVA_0",
    "IVA_5",
    "IVA_12",
    "IVA_14",
    "IVA_15",
    "NO_IVA",
    "EXENTO_IVA",
  ]),
  taxAmount: z.number().min(0).default(0),
  discountRate: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  subtotal: z.number().positive(),
});

export const createInvoiceItemSchema = invoiceItemSchema.omit({ id: true });

export const updateInvoiceItemSchema = invoiceItemSchema
  .partial()
  .required({ id: true });

export const InvoiceItemResponseSchema = invoiceItemSchema.extend({
  product: z.object({
    id: z.string().cuid(),
    code: z.string(),
    description: z.string(),
    price: z.number().positive(),
  }),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceItem = z.infer<typeof createInvoiceItemSchema>;
export type UpdateInvoiceItem = z.infer<typeof updateInvoiceItemSchema>;
export type InvoiceItemResponse = z.infer<typeof InvoiceItemResponseSchema>;
