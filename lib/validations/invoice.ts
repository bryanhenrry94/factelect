import { z } from "zod";
import { createInvoiceItemSchema } from "./invoice-item";
import { createInvoicePaymentMethodSchema } from "./invoice-payment-method";

export const invoiceSchema = z.object({
  id: z.string().cuid().optional(),
  personId: z.string().min(1, "El cliente es obligatorio"),

  // Datos de emisión
  establishmentId: z.string().min(1, "El establecimiento es obligatorio"),
  emissionPointId: z.string().min(1, "El punto de emisión es obligatorio"),
  sequential: z
    .number()
    .int()
    .positive("El número secuencial debe ser positivo"),

  status: z.enum([
    "DRAFT",
    "SIGNED",
    "SENT",
    "PENDING_AUTHORIZATION",
    "AUTHORIZED",
    "REJECTED",
    "CANCELED",
  ]),

  // Fechas
  issueDate: z.date(),
  term: z.number().int().min(0, "El plazo no puede ser negativo"),
  dueDate: z.date(),

  // Totales
  total: z.number().min(0, "El total de la factura no puede ser negativo"),
  paidAmount: z.number().min(0, "El monto pagado no puede ser negativo"),
  balance: z.number().min(0, "El saldo no puede ser negativo"),

  // Descripción o observaciones
  description: z.string().optional().nullable(),

  // Datos autorizacion
  accessKey: z.string().optional().nullable(),
  authorizationNumber: z.string().optional().nullable(),
  authorizationDate: z.date().optional().nullable(),

  // Archivos electrónicos
  xmlFilePath: z.string().optional().nullable(),
  xmlFileUrl: z.string().optional().nullable(),
  pdfFilePath: z.string().optional().nullable(),
  pdfFileUrl: z.string().optional().nullable(),
  sriResponse: z.any().optional().nullable(), // Json type

  tenantId: z.string().min(1, "El tenant es obligatorio"),

  // Auditoría
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  canceledAt: z.date().optional().nullable(),
});

export const InvoiceResponseSchema = invoiceSchema.extend({
  person: z.object({
    id: z.string().cuid(),
    firstName: z.string(),
    lastName: z.string(),
    identification: z.string(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
  }),
  document: z.string().optional().nullable(),
});

// Schema para crear una nueva factura (sin campos auto-generados)
export const createInvoiceSchema = invoiceSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
    canceledAt: true,
  })
  .extend({
    items: z
      .array(createInvoiceItemSchema)
      .min(1, "El detalle de items es obligatorio"),
    paymentMethods: z
      .array(createInvoicePaymentMethodSchema)
      .min(1, "Debe agregar al menos un método de pago"),
  });

// Schema para actualizar una factura
export const updateInvoiceSchema = invoiceSchema.partial().omit({
  id: true,
  createdAt: true,
});

// Tipos TypeScript derivados
export type Invoice = z.infer<typeof invoiceSchema>;
export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;
export type InvoiceForm = z.infer<typeof createInvoiceSchema>;
