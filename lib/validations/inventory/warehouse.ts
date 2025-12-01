import { z } from "zod";

export const warehouseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  costCenterId: z.string().nullable().optional(),
});

export const createWarehouseSchema = warehouseSchema.omit({
  id: true,
  tenantId: true,
});

export const updateWarehouseSchema = warehouseSchema
  .partial()
  .omit({ id: true, tenantId: true });

export type Warehouse = z.infer<typeof warehouseSchema>;
export type CreateWarehouse = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouse = z.infer<typeof updateWarehouseSchema>;
