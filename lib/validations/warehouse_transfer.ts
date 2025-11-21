import { z } from "zod";

export const TransferStatusEnum = z.enum(["PENDING", "APPROVED", "CANCELED"]);

export const WarehouseTransferSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
  date: z.date(),
  reference: z.string().nullable().optional(),
  status: TransferStatusEnum.default("PENDING"),
  approvedBy: z.string().nullable().optional(),
  items: z.array(z.any()), // Replace z.any() with actual WarehouseTransferItem schema if available
  tenant: z.any(), // Replace z.any() with actual Tenant schema if available
});

export type WarehouseTransfer = z.infer<typeof WarehouseTransferSchema>;
