import { z } from "zod";
import { establishmentSchema } from "./establishment";
import { EmissionPointSequenceSchema } from "./emission-point-sequence";

export const emissionPointSchema = z.object({
  id: z.cuid().optional(),
  tenantId: z.cuid(),
  establishmentId: z.string(),
  code: z
    .string()
    .length(3, "El código del punto de emisión debe tener 3 caracteres"),
  description: z.string().optional().nullable(),
  sequences: z.array(EmissionPointSequenceSchema).optional(),
  isActive: z.boolean(),
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
