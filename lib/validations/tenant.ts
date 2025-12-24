import { z } from "zod";

export const tenantSchema = z.object({
  id: z.string().uuid(),
  // Identidad
  legalName: z.string().min(1, "El nombre es obligatorio"),
  tradeName: z.string().optional(),
  ruc: z.string().min(1, "El RUC es obligatorio"),
  subdomain: z
    .string()
    .min(1, "El subdominio es obligatorio")
    .regex(
      /^[a-z0-9-]+$/,
      "El subdominio solo debe contener letras minúsculas, números y guiones"
    ),
  // Datos fiscales
  contributorType: z.enum(["NATURAL", "SOCIETY", "SPECIAL", "PUBLIC"]),
  taxRegime: z.enum(["GENERAL", "RIMPE_EMPRENDEDOR", "RIMPE_NEGOCIO_POPULAR"]),
  obligatedAccounting: z.boolean(),
  isWithholdingAgent: z.boolean(),
  isSpecialContributor: z.boolean(),
  specialContributorNumber: z.string().optional(),
  economicActivity: z.string().optional(),
  // Contacto fiscal
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  // Branding
  logoUrl: z.string().optional(),
  // SRI Configuration
  sriConfiguration: z.any().optional(), // Replace with specific schema if needed
  // Timestamps
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
