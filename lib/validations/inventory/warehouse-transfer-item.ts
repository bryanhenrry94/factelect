import { z } from "zod";

export const warehouseTransferItemSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  transferId: z.string(),
  productId: z.string(),
  unitId: z.string(),
  quantity: z.number(),
});

export const createWarehouseTransferItemSchema =
  warehouseTransferItemSchema.omit({
    id: true,
    tenantId: true,
  });

export const updateWarehouseTransferItemSchema =
  createWarehouseTransferItemSchema.partial();

export type WarehouseTransferItem = z.infer<typeof warehouseTransferItemSchema>;
export type CreateWarehouseTransferItem = z.infer<
  typeof createWarehouseTransferItemSchema
>;
export type UpdateWarehouseTransferItem = z.infer<
  typeof updateWarehouseTransferItemSchema
>;
