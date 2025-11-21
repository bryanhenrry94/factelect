import { z } from "zod";

export const InventoryMoveTypeEnum = z.enum([
  "IN",
  "OUT",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "ADJUST",
]);

export const InventoryMovementSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  productId: z.string(),
  warehouseId: z.string(),
  documentId: z.string().nullable().optional(),
  type: InventoryMoveTypeEnum,
  quantity: z.number(),
  balance: z.number().default(0),
  cost: z.number().default(0),
  totalCost: z.number().default(0),
  reference: z.string().nullable().optional(),
  date: z.coerce.date(),
});

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;
