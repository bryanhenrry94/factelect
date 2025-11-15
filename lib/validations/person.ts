import { z } from "zod";

export const personSchema = z.object({
  id: z.string().cuid(),
  identificationType: z.enum([
    "RUC",
    "CEDULA",
    "PASAPORTE",
    "VENTA_A_CONSUMIDOR_FINAL",
    "IDENTIFICACION_DE_EXTERIOR",
    "PLACA",
  ]),
  identification: z.string().min(1, "La identificación es obligatoria"),
  firstName: z.string().min(1, "El campo nombre es obligatorio"),
  lastName: z.string().min(1, "El campo apellido es obligatorio"),
  email: z.string().email("El formato del correo electrónico es inválido"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  roles: z
    .array(z.enum(["CLIENT", "SUPPLIER", "SELLER"]))
    .min(1, "Selecciona al menos un rol"),
  tenantId: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createPersonSchema = personSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePersonSchema = personSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type PersonInput = z.infer<typeof personSchema>;
export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
