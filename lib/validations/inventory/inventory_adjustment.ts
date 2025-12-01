import { z } from "zod";

export const InventoryAdjustmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  date: z.date(),
  reason: z.string().nullable().optional(),
  createdBy: z.string(),
  items: z.array(z.any()), // Replace z.any() with InventoryAdjustmentItemSchema if defined
  tenant: z.any(), // Replace z.any() with TenantSchema if defined
});

export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;
