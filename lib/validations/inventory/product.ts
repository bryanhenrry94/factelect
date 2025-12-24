import { z } from "zod";

export const productSchema = z.object({
  id: z.cuid(),
  tenantId: z.cuid(),
  code: z.string().min(1, "El código es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  price: z.number().positive("El precio debe ser positivo"),
  tax: z.enum([
    "IVA_0",
    "IVA_5",
    "IVA_12",
    "IVA_14",
    "IVA_15",
    "NO_IVA",
    "EXENTO_IVA",
  ]),
  type: z.enum(["PRODUCT", "SERVICE"]),
  barcode: z.string().optional().nullable(),
  unitId: z.string().min(1, "La unidad es obligatoria"),
  categoryId: z.string().min(1, "La categoría es obligatoria"),
  salesAccountId: z.string().optional().nullable(),
  inventoryAccountId: z.string().optional().nullable(),
  costAccountId: z.string().optional().nullable(),
  isActive: z.boolean(),
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
