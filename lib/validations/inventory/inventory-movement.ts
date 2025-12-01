import { z } from "zod";
import { CreateInventoryMovementItemSchema } from "./inventory-movement-item";

export const InventoryMoveTypeEnum = z.enum([
  "IN",
  "OUT",
  "TRANSFER",
  "ADJUST",
]);

export const InventoryMovementSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: InventoryMoveTypeEnum,
  warehouseId: z.string(),
  date: z.date(),
  description: z.string(),
  documentId: z.string().nullable().optional(),
  transferId: z.string().nullable().optional(),
  adjustmentId: z.string().nullable().optional(),
  items: z.array(CreateInventoryMovementItemSchema),
});

export const createInventoryMovementSchema = InventoryMovementSchema.omit({
  id: true,
  tenantId: true,
});

export const updateInventoryMovementSchema =
  InventoryMovementSchema.partial().omit({ id: true, tenantId: true });

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;
export type CreateInventoryMovement = z.infer<
  typeof createInventoryMovementSchema
>;
export type UpdateInventoryMovement = z.infer<
  typeof updateInventoryMovementSchema
>;
