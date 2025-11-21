import { z } from "zod";

export const TaxSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  rate: z.number(), // If you use Decimal.js, consider z.instanceof(Decimal)
});

export type Tax = z.infer<typeof TaxSchema>;
