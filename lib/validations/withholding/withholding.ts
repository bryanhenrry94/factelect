import { z } from "zod";
import { WithholdingDetailCreateSchema } from "./withholding-detail";

export const WithholdingSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  documentId: z.string(),
  issueDate: z.date(),
  totalWithheld: z.number(),
  createdAt: z.date(),
  document: z.object({
    id: z.string(),
    tenantId: z.string(),
    entityType: z.enum(["CUSTOMER", "SUPPLIER"]),
    documentType: z.string(),
    status: z.string(),
    number: z.string().min(1, { message: "El número es obligatorio" }),
    authorizationNumber: z.string().nullable().optional(),
    authorizedAt: z.date().nullable().optional(),
    issueDate: z.date(),
    subtotal: z.number(),
    taxTotal: z.number(),
    discount: z.number(),
    total: z.number(),
    paidAmount: z.number(),
    balance: z.number(),
    relatedDocumentId: z.string().nullable().optional(),
  }),
  details: z.array(WithholdingDetailCreateSchema),
});

export const WithholdingCreateSchema = WithholdingSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export const WithholdingUpdateSchema = WithholdingSchema.partial();

export type Withholding = z.infer<typeof WithholdingSchema>;
export type WithholdingCreate = z.infer<typeof WithholdingCreateSchema>;
export type WithholdingUpdate = z.infer<typeof WithholdingUpdateSchema>;
