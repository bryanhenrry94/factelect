import { z } from "zod";

export const WithholdingTypeEnum = z.enum(["IVA", "SOURCE"]);

export const WithholdingCodeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().nullable().optional(),
  type: WithholdingTypeEnum,
  code: z.string(),
  description: z.string(),
  percentage: z.number(),
  active: z.boolean(),
  accountId: z.string().nullable().optional(),
  createdAt: z.date(),
});

export const WithholdingCodeCreateSchema = WithholdingCodeSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
});
export const WithholdingCodeUpdateSchema = WithholdingCodeSchema.partial();

export type WithholdingCode = z.infer<typeof WithholdingCodeSchema>;
export type WithholdingCodeCreate = z.infer<typeof WithholdingCodeCreateSchema>;
export type WithholdingCodeUpdate = z.infer<typeof WithholdingCodeUpdateSchema>;
