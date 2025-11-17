import { z } from "zod";

export const DocumentTaxSchema = z.object({
  id: z.string(), // cuid() generates a string
  sale_id: z.string(),
  code: z.string(),
  percentage_code: z.string(),
  base: z.number(),
  amount: z.number(),
});

export const createDocumentTaxSchema = DocumentTaxSchema.omit({
  id: true,
});

export const updateDocumentTaxSchema = createDocumentTaxSchema.partial();

export type DocumentTax = z.infer<typeof DocumentTaxSchema>;
export type CreateDocumentTax = z.infer<typeof createDocumentTaxSchema>;
export type UpdateDocumentTax = z.infer<typeof updateDocumentTaxSchema>;
