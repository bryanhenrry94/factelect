import { z } from "zod";

export const EmissionPointSequenceSchema = z.object({
  id: z.string(),
  emissionPointId: z.string(),
  documentType: z.enum([
    "INVOICE",
    "PURCHASE",
    "CREDIT_NOTE",
    "DEBIT_NOTE",
    "WITHHOLDING",
    "REMISSION_GUIDE",
  ]),
  currentSequence: z.number().int().default(1),
});

export type EmissionPointSequence = z.infer<typeof EmissionPointSequenceSchema>;
