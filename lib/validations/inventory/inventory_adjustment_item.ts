import { z } from "zod";

export const InventoryAdjustmentItemSchema = z.object({
  id: z.string(),
  adjustmentId: z.string(),
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number(),
  cost: z.number().nullable().optional(),
});

export type InventoryAdjustmentItem = z.infer<
  typeof InventoryAdjustmentItemSchema
>;
