import { z } from "zod";

export const establishmentSchema = z.object({
  id: z.cuid().optional(),
  tenantId: z.string(),
  code: z
    .string()
    .length(3, "El código del establecimiento debe tener 3 caracteres"),
  address: z.string().min(1, "La dirección es obligatoria"),
});

export const createEstablishmentSchema = establishmentSchema.omit({
  tenantId: true,
  id: true,
});

export const updateEstablishmentSchema = establishmentSchema
  .partial()
  .omit({ id: true });

export type Establishment = z.infer<typeof establishmentSchema>;
export type CreateEstablishment = z.infer<typeof createEstablishmentSchema>;
export type UpdateEstablishment = z.infer<typeof updateEstablishmentSchema>;
