import { z } from "zod";
import { establishmentSchema } from "./establishment";

export const emissionPointSchema = z.object({
  id: z.string().cuid().optional(),
  tenantId: z.string().cuid(),
  establishmentId: z.string(),
  code: z.string().length(3, "Code must be exactly 3 digits"),
  description: z.string().optional().nullable(),
  currentInvoiceSequence: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const createEmissionPointSchema = emissionPointSchema.omit({
  id: true,
});

export const updateEmissionPointSchema = emissionPointSchema
  .partial()
  .omit({ id: true });

export const emissionPointWithEstablishmentSchema = emissionPointSchema.extend({
  establishment: establishmentSchema,
});

export type CreateEmissionPoint = z.infer<typeof createEmissionPointSchema>;
export type UpdateEmissionPoint = z.infer<typeof updateEmissionPointSchema>;
export type EmissionPoint = z.infer<typeof emissionPointSchema>;
export type EmissionPointWithEstablishmentSchema = z.infer<
  typeof emissionPointWithEstablishmentSchema
>;
