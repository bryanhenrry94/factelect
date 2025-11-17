import { z } from "zod";

export const tenantSriConfigBaseSchema = z.object({
  environment: z.enum(["TEST", "PRODUCTION"]),
  certificatePath: z.string().nullable().optional(),
  certificatePassword: z.string().nullable().optional(),
});

/**
 * 🧩 Esquema completo — usado para lectura desde base de datos o persistencia.
 */
export const tenantSriConfigSchema = tenantSriConfigBaseSchema.extend({
  id: z.uuid().optional(),
  tenantId: z.uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * ✨ Esquema para creación — excluye campos gestionados por el sistema.
 */
export const createTenantSriConfigSchema = tenantSriConfigSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * 🧠 Esquema para actualización — todos los campos opcionales.
 */
export const updateTenantSriConfigSchema = tenantSriConfigSchema
  .partial()
  .omit({
    id: true,
    tenantId: true,
    createdAt: true,
    updatedAt: true,
  });

/**
 * 📘 Tipos derivados
 */
export type TenantSriConfig = z.infer<typeof tenantSriConfigSchema>;
export type CreateTenantSriConfig = z.infer<typeof createTenantSriConfigSchema>;
export type UpdateTenantSriConfig = z.infer<typeof updateTenantSriConfigSchema>;
export type TenantSriConfigInput = z.infer<typeof tenantSriConfigBaseSchema>;
