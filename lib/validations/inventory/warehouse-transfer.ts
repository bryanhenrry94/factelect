import { z } from "zod";

export const TransferStatusEnum = z.enum(["PENDING", "APPROVED", "CANCELED"]);

export const WarehouseTransferSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  date: z.date(),
  description: z.string(),
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
});

export const createWarehouseTransferSchema = WarehouseTransferSchema.omit({
  id: true,
  tenantId: true,
});

export const updateWarehouseTransferSchema =
  createWarehouseTransferSchema.partial();

export type WarehouseTransfer = z.infer<typeof WarehouseTransferSchema>;
export type CreateWarehouseTransfer = z.infer<
  typeof createWarehouseTransferSchema
>;
export type UpdateWarehouseTransfer = z.infer<
  typeof updateWarehouseTransferSchema
>;
