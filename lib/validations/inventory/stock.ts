import { z } from "zod";

export const stockSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  productId: z.string(),
  warehouseId: z.string(),
  quantity: z.number().default(0),
  minQuantity: z.number().default(0),
});

export const createStockSchema = stockSchema.omit({ id: true });

export const updateStockSchema = stockSchema.partial().omit({ id: true });

export type Stock = z.infer<typeof stockSchema>;
export type CreateStock = z.infer<typeof createStockSchema>;
export type UpdateStock = z.infer<typeof updateStockSchema>;
