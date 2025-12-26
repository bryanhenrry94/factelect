import { z } from "zod";
import { WithholdingDetailSchema } from "./withholding-detail";
import { createDocumentSchema } from "../document/document";

export const WithholdingSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  documentId: z.string(),
  issueDate: z.date(),
  totalWithheld: z.number(),
  createdAt: z.date(),
  document: createDocumentSchema,
  details: z.array(WithholdingDetailSchema),
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
