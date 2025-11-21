import { z } from "zod";

export const RetentionTypeEnum = z.enum(["IVA", "RENTA"]);

export const RetentionSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  documentId: z.string(),
  type: RetentionTypeEnum,
  percentage: z.number(),
  base: z.number(),
  amount: z.number(),
});

export const CreateRetentionSchema = RetentionSchema.omit({
  id: true,
  tenantId: true,
});

export const UpdateRetentionSchema = CreateRetentionSchema.partial();

export type Retention = z.infer<typeof RetentionSchema>;
export type CreateRetention = z.infer<typeof CreateRetentionSchema>;
export type UpdateRetention = z.infer<typeof UpdateRetentionSchema>;
