import { z } from "zod";

export const MovementTypeEnum = z.enum(["IN", "OUT"]);

export const movementSchema = z.object({
  id: z.string().cuid().optional(),
  tenantId: z.string().min(1, "El tenant es requerido"),
  accountId: z.string().min(1, "El account es requerido"),
  transactionId: z.string().nullable().optional(),
  type: MovementTypeEnum,
  amount: z.number().min(0, "El monto es requerido"),
  date: z.date(),
  description: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  reconciled: z.boolean().default(false),
  reconciledAt: z.date().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createMovementSchema = movementSchema.omit({
  id: true,
  tenantId: true,
  reconciledAt: true,
  createdAt: true,
  updatedAt: true,
});

export const updateMovementSchema = movementSchema.partial().required({
  id: true,
});

export type Movement = z.infer<typeof movementSchema>;
export type CreateMovement = z.infer<typeof createMovementSchema>;
export type UpdateMovement = z.infer<typeof updateMovementSchema>;
