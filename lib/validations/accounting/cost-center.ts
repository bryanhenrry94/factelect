import { z } from "zod";

export const costCenterSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  code: z.string().min(1, "El código es obligatorio"),
  name: z.string().min(1, "El nombre es obligatorio"),
});

export const createCostCenterSchema = costCenterSchema.omit({
  id: true,
  tenantId: true,
});
export const updateCostCenterSchema = costCenterSchema.partial();

export type CostCenter = z.infer<typeof costCenterSchema>;
export type CreateCostCenterInput = z.infer<typeof createCostCenterSchema>;
export type UpdateCostCenterInput = z.infer<typeof updateCostCenterSchema>;
