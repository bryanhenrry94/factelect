import { $Enums } from "@/prisma/generated/prisma";
import { z } from "zod";

// Enum for identification types (adjust values as needed)
export const IdentificationTypeSchema = z.enum([
  $Enums.IdentificationType.CEDULA,
  $Enums.IdentificationType.RUC,
  $Enums.IdentificationType.PASAPORTE,
  $Enums.IdentificationType.IDENTIFICACION_DE_EXTERIOR,
  $Enums.IdentificationType.VENTA_A_CONSUMIDOR_FINAL,
  $Enums.IdentificationType.PLACA,
]);

export const CustomerBaseSchema = z
  .object({
    id: z.string().cuid({ message: "El ID del cliente no es válido" }),
    identificationType: IdentificationTypeSchema,

    identification: z
      .string({ message: "La identificación es obligatoria" })
      .min(1, "La identificación es obligatoria"),

    name: z
      .string({ message: "El nombre es obligatorio" })
      .min(1, "El nombre es obligatorio"),

    email: z
      .string({ message: "El correo electrónico es obligatorio" })
      .email("Formato de correo electrónico no válido"),

    phone: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || /^\+?\d{6,15}$/.test(val), {
        message: "Número de teléfono no válido",
      }),

    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),

    tenantId: z
      .string()
      .cuid({ message: "Formato de ID de inquilino no válido" })
      .optional(),

    createdAt: z
      .union([z.string(), z.date()])
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),

    updatedAt: z
      .union([z.string(), z.date()])
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
  })
  .refine(
    (data) => {
      const id = data.identification;
      if (!id) return true;

      switch (data.identificationType) {
        case $Enums.IdentificationType.RUC:
          return /^\d{13}$/.test(id);
        case $Enums.IdentificationType.CEDULA:
          return /^\d{10}$/.test(id);
        case $Enums.IdentificationType.PASAPORTE:
          return /^[a-zA-Z0-9]+$/.test(id);
        default:
          return true;
      }
    },
    {
      message: "Invalid identification format for the selected type",
      path: ["identification"],
    }
  );

// Create customer schema (excludes auto-generated fields)
export const CustomerCreateSchema = CustomerBaseSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

// Update customer schema (all fields optional except those that shouldn't change)
export const CustomerUpdateSchema = CustomerBaseSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type CustomerBase = z.infer<typeof CustomerBaseSchema>;
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;
export type CustomerReponse = CustomerBase;
export type CustomerFormInputs = z.infer<typeof CustomerCreateSchema>;
