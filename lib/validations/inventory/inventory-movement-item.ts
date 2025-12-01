import { z } from "zod";

export const InventoryMovementItemSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  inventoryMoveId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  unitId: z.string(),
  cost: z.number(),
  totalCost: z.number(),
});

export const CreateInventoryMovementItemSchema =
  InventoryMovementItemSchema.omit({
    id: true,
    tenantId: true,
    inventoryMoveId: true,
  });

export const UpdateInventoryMovementItemSchema =
  InventoryMovementItemSchema.partial().omit({
    id: true,
    tenantId: true,
  });

export type InventoryMovementItem = z.infer<typeof InventoryMovementItemSchema>;
export type CreateInventoryMovementItem = z.infer<
  typeof CreateInventoryMovementItemSchema
>;
export type UpdateInventoryMovementItem = z.infer<
  typeof UpdateInventoryMovementItemSchema
>;
