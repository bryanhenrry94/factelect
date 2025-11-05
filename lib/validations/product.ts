import { z } from "zod";

export const productSchema = z.object({
  id: z.string().cuid(),
  code: z.string().min(1, "Code is required"),
  description: z.string(),
  price: z.number().positive("Price must be positive"),
  tax: z.enum([
    "IVA_0",
    "IVA_5",
    "IVA_12",
    "IVA_14",
    "IVA_15",
    "NO_IVA",
    "EXENTO_IVA",
  ]),
  tenantId: z.string().cuid("Invalid tenant ID"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createProductSchema = productSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProductSchema = productSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
