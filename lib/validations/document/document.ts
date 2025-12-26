import { z } from "zod";
import { createDocumentItemSchema } from "./document-item";
import {
  createDocumentFiscalInfoSchema,
  DocumentFiscalInfoSchema,
} from "./document-fiscal-info";
import { createDocumentPaymentSchema } from "./document-payment";

export const entityTypeEnum = z.enum(["CUSTOMER", "SUPPLIER"]);
export const documentTypeEnum = z.enum([
  "INVOICE",
  "PURCHASE",
  "CREDIT_NOTE",
  "DEBIT_NOTE",
  "WITHHOLDING",
  "REMISSION_GUIDE",
]);

export const documentStatusEnum = z.enum(["DRAFT", "CONFIRMED", "CANCELED"]);

export const documentSchema = z.object({
  id: z.cuid(),
  tenantId: z.string(),
  entityType: entityTypeEnum,
  documentType: documentTypeEnum,

  issueDate: z.date(),
  dueDate: z.date().nullable().optional(),
  status: documentStatusEnum,
  personId: z.string(),

  // 📌 Datos fiscales básicos (también para docs recibidos)
  number: z.string().nullable().optional(), // 001-001-000012345
  accessKey: z.string().nullable().optional(), // clave de acceso SRI
  authorizationNumber: z.string().nullable().optional(), // autorización SRI
  authorizedAt: z.date().nullable().optional(), // DateTime?

  // Para relacionar con facturas base
  relatedDocumentId: z.string().nullable().optional(),
  relatedDocument: z.any().optional(), // Document? (relation, use z.any() or a proper schema if available)

  subtotal: z.number(),
  taxTotal: z.number(),
  discount: z.number(),
  total: z.number(),
  paidAmount: z.number(),
  totalWithheld: z.number(),
  balance: z.number(),

  description: z.string().nullable().optional(),

  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),

  // Relations (for response schemas)
  items: z.array(createDocumentItemSchema).optional(),
  documentPayments: z.array(createDocumentPaymentSchema).optional(),

  taxes: z.array(z.any()).optional(), // Replace z.any() with your DocumentTax schema
  transactions: z.array(z.any()).optional(), // Replace z.any() with your Transaction schema
  invoices: z.array(z.any()).optional(), // Replace z.any() with your Invoice schema
});

export const createDocumentSchema = documentSchema
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    items: z
      .array(createDocumentItemSchema)
      .min(1, "El detalle de items es obligatorio"),
    fiscalInfo: createDocumentFiscalInfoSchema.optional(),
  });

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentResponseSchema = documentSchema.extend({
  person: z
    .object({
      id: z.string(),
      fullname: z.string().optional(),
      identification: z.string().optional(),
    })
    .optional(),
  documentFiscalInfo: DocumentFiscalInfoSchema.optional(),
  withholding: documentSchema.optional(),
});

export type Document = z.infer<typeof documentSchema>;
export type DocumentResponse = z.infer<typeof documentResponseSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
