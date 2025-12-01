import { z } from "zod";

export const warehouseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  location: z.string().nullable().optional(),
  // Relations as arrays of unknowns or you can import their schemas if available
  stocks: z.array(z.unknown()),
  movements: z.array(z.unknown()),
  tenant: z.unknown(),
  documentItems: z.array(z.unknown()),
  InventoryAdjustmentItem: z.array(z.unknown()),
});

export const createWarehouseSchema = warehouseSchema.omit({ id: true });

export const updateWarehouseSchema = warehouseSchema
  .partial()
  .omit({ id: true, tenantId: true });

export type Warehouse = z.infer<typeof warehouseSchema>;
export type CreateWarehouse = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouse = z.infer<typeof updateWarehouseSchema>;
