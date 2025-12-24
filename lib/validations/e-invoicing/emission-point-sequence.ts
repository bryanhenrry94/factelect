import { z } from "zod";

export const EmissionPointSequenceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  establishmentId: z.string(),
  emissionPointId: z.string(),
  documentType: z.string(), // Replace with z.nativeEnum(DocumentType) if you have the enum
  currentSequence: z.number().int().default(1),
});

export type EmissionPointSequence = z.infer<typeof EmissionPointSequenceSchema>;
