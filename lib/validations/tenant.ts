import { z } from "zod";

export const tenantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  tradeName: z.string().optional(),
  subdomain: z
    .string()
    .min(1, "El subdominio es obligatorio")
    .regex(
      /^[a-z0-9-]+$/,
      "El subdominio solo debe contener letras minúsculas, números y guiones"
    ),
  ruc: z.string().optional(),
  phone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url().optional(),
  sriConfig: z.any().optional(), // Replace with specific schema if needed
  obligatedAccounting: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createTenantSchema = tenantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTenantSchema = tenantSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Tenant = z.infer<typeof tenantSchema>;
export type CreateTenant = z.infer<typeof createTenantSchema>;
export type UpdateTenant = z.infer<typeof updateTenantSchema>;
