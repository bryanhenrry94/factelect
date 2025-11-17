import { z } from "zod";

export const personSchema = z
  .object({
    id: z.string().cuid(),
    identificationType: z.enum([
      "RUC",
      "CEDULA",
      "PASAPORTE",
      "VENTA_A_CONSUMIDOR_FINAL",
      "IDENTIFICACION_DE_EXTERIOR",
      "PLACA",
    ]),
    identification: z
      .string()
      .min(1, "El campo identificación es obligatorio"), // ← mensaje claro
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
  })
  .superRefine((data, ctx) => {
    const value = data.identification?.trim() ?? "";

    // Validación CÉDULA (10 dígitos)
    if (data.identificationType === "CEDULA") {
      if (!/^[0-9]{10}$/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La cédula debe tener exactamente 10 dígitos numéricos",
          path: ["identification"],
        });
      }
    }

    // Validación RUC (13 dígitos)
    if (data.identificationType === "RUC") {
      if (!/^[0-9]{13}$/.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El RUC debe tener exactamente 13 dígitos numéricos",
          path: ["identification"],
        });
      }
    }
  });

/**
 * CREATE
 */
export const createPersonSchema = personSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});


/**
 * UPDATE
 */
export const updatePersonSchema = personSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .superRefine((data, ctx) => {
    // Si no envían identificación en update, no validar
    if (!data.identification || !data.identificationType) return;

    const value = data.identification.trim();

    if (data.identificationType === "CEDULA" && !/^[0-9]{10}$/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La cédula debe tener exactamente 10 dígitos numéricos",
        path: ["identification"],
      });
    }

    if (data.identificationType === "RUC" && !/^[0-9]{13}$/.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El RUC debe tener exactamente 13 dígitos numéricos",
        path: ["identification"],
      });
    }
  });


/**
 * TYPES
 */
export type PersonInput = z.infer<typeof personSchema>;
export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
