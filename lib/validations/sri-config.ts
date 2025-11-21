import { z } from "zod";

export const sriEnvironmentEnum = z.enum(["TEST", "PRODUCTION"]); // TEST: Sandbox, PRODUCTION: Producción

export const tenantSriConfigBaseSchema = z.object({
  environment: sriEnvironmentEnum, // SRIEnvironment: "TEST" | "PRODUCTION"
  certificatePath: z.string().nullable().optional(),
  certificateUrl: z.string().nullable().optional(),
  certificatePassword: z.string().nullable().optional(),
});

export const tenantSriConfigSchema = tenantSriConfigBaseSchema.extend({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
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
