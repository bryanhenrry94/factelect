import { z } from "zod";

export const establishmentSchema = z.object({
  id: z.string().cuid().optional(),
  sriConfigId: z.string(),
  code: z.string().length(3, "Code must be exactly 3 digits"),
  address: z.string().min(1, "Address is required"),
});

export const createEstablishmentSchema = establishmentSchema.omit({
  id: true,
});

export const updateEstablishmentSchema = establishmentSchema
  .partial()
  .omit({ id: true });

export type Establishment = z.infer<typeof establishmentSchema>;
export type CreateEstablishment = z.infer<typeof createEstablishmentSchema>;
export type UpdateEstablishment = z.infer<typeof updateEstablishmentSchema>;
