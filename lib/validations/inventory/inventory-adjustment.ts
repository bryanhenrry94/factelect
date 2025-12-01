import { z } from "zod";

import { InventoryAdjustmentItemSchema } from "./inventory-adjustment-item";
import { InventoryMovementSchema } from "./inventory-movement";

export const InventoryAdjustmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  date: z.date(),
  description: z.string(),
  createdBy: z.string(),
  items: z.array(InventoryAdjustmentItemSchema),
  inventoryMovement: z.array(InventoryMovementSchema),
});

export const createInventoryAdjustmentSchema = InventoryAdjustmentSchema.omit({
  id: true,
  inventoryMovement: true,
});

export const updateInventoryAdjustmentSchema =
  InventoryAdjustmentSchema.partial().omit({
    id: true,
    tenantId: true,
    createdBy: true,
    inventoryMovement: true,
  });

export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;
export type CreateInventoryAdjustment = z.infer<
  typeof createInventoryAdjustmentSchema
>;
export type UpdateInventoryAdjustment = z.infer<
  typeof updateInventoryAdjustmentSchema
>;
