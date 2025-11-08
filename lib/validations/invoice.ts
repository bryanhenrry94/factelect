import { email, z } from "zod";

export const invoiceSchema = z.object({
  id: z.string().cuid().optional(),
  customerId: z.string().min(1, "Customer ID is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),

  // Datos de emisión
  emissionPointId: z.string().min(1, "Emission point ID is required"),
  sequential: z
    .number()
    .int()
    .positive("Sequential must be a positive integer"),
  accessKey: z.string().optional().nullable(),
  authorizationNumber: z.string().optional().nullable(),
  authorizationDate: z.date().optional().nullable(),
  status: z
    .enum(["DRAFT", "SIGNED", "SENT", "AUTHORIZED", "REJECTED", "CANCELED"])
    .default("DRAFT"),

  // Fechas
  issueDate: z.date(),
  term: z
    .number()
    .int()
    .min(0, "Term must be a non-negative integer")
    .default(0),
  dueDate: z.date(),

  // Totales
  total: z.number().min(0, "Total must be non-negative").default(0),

  // Descripción o observaciones
  description: z.string().optional().nullable(),

  // Archivos electrónicos
  xmlFilePath: z.string().optional().nullable(),
  xmlFileUrl: z.string().optional().nullable(),
  pdfFilePath: z.string().optional().nullable(),
  pdfFileUrl: z.string().optional().nullable(),
  sriResponse: z.any().optional().nullable(), // Json type

  // Auditoría
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  canceledAt: z.date().optional().nullable(),
});

export const InvoiceResponseSchema = invoiceSchema.extend({
  customer: z.object({
    id: z.string().cuid(),
    name: z.string(),
    identification: z.string(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
  }),
  document: z.string().optional().nullable(),
});

// Schema para crear una nueva factura (sin campos auto-generados)
export const createInvoiceSchema = invoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
