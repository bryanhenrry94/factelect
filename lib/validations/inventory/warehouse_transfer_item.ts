import { z } from "zod";

export const warehouseTransferItemSchema = z.object({
  id: z.string(),
  transferId: z.string(),
  productId: z.string(),
  quantity: z.number(),
});

export type WarehouseTransferItem = z.infer<typeof warehouseTransferItemSchema>;
