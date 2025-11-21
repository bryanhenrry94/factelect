import { z } from "zod";

export const UnitSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, "El nombre es obligatorio"),
  symbol: z.string().min(1, "El símbolo es obligatorio"),
});

export const CreateUnitSchema = UnitSchema.omit({
  id: true,
  tenantId: true,
});

export const UpdateUnitSchema = UnitSchema.partial().omit({
  id: true,
  tenantId: true,
});

export type Unit = z.infer<typeof UnitSchema>;
export type CreateUnit = z.infer<typeof CreateUnitSchema>;
export type UpdateUnit = z.infer<typeof UpdateUnitSchema>;
