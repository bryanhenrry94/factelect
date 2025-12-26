import { z } from "zod";

export const WithholdingTypeEnum = z.enum(["IVA", "SOURCE"]);

export const WithholdingDetailSchema = z.object({
  id: z.string().uuid(),

  tenantId: z.string(),
  withholdingId: z.string(),
  codeId: z.string(),
  type: WithholdingTypeEnum,

  baseAmount: z.number(),
  percentage: z.number(),
  withheldAmount: z.number(),

  accountId: z.string().nullable().optional(),
});

export const WithholdingDetailCreateSchema = WithholdingDetailSchema.omit({
  id: true,
  tenantId: true,
  withholdingId: true,
});

export const WithholdingDetailUpdateSchema = WithholdingDetailSchema.partial();

export type WithholdingDetail = z.infer<typeof WithholdingDetailSchema>;
export type WithholdingDetailCreate = z.infer<
  typeof WithholdingDetailCreateSchema
>;
export type WithholdingDetailUpdate = z.infer<
  typeof WithholdingDetailUpdateSchema
>;
