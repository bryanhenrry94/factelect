import { z } from "zod";

export const InventoryAdjustmentItemSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  adjustmentId: z.string(),
  productId: z.string(),
  unitId: z.string(),
  warehouseId: z.string(),
  quantity: z.number(),
  cost: z.number().nullable().optional(),
});

export const createInventoryAdjustmentItemSchema =
  InventoryAdjustmentItemSchema.omit({
    id: true,
    tenantId: true,
  });

export const updateInventoryAdjustmentItemSchema =
  InventoryAdjustmentItemSchema.partial().omit({
    id: true,
    tenantId: true,
    adjustmentId: true,
  });

export type InventoryAdjustmentItem = z.infer<
  typeof InventoryAdjustmentItemSchema
>;
export type CreateInventoryAdjustmentItem = z.infer<
  typeof createInventoryAdjustmentItemSchema
>;
export type UpdateInventoryAdjustmentItem = z.infer<
  typeof updateInventoryAdjustmentItemSchema
>;
