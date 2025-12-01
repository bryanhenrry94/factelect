import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, "El nombre es obligatorio"),
  // products and tenant are relations, so you may want to validate them separately or omit them here
});

export const CreateCategorySchema = CategorySchema.omit({
  id: true,
  tenantId: true,
});

export const UpdateCategorySchema = CategorySchema.partial().omit({
  id: true,
  tenantId: true,
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
