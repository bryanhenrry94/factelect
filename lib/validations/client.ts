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

export const ClientBaseSchema = z
  .object({
    id: z.string().cuid({ message: "Invalid client ID format" }),
    identificationType: IdentificationTypeSchema,

    identification: z
      .string({ message: "Identification is required" })
      .min(1, "Identification is required"),

    name: z.string({ message: "Name is required" }).min(1, "Name is required"),

    email: z
      .string({ message: "Email is required" })
      .email("Invalid email format"),

    phone: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || /^\+?\d{6,15}$/.test(val), {
        message: "Invalid phone number",
      }),

    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),

    tenantId: z
      .string()
      .cuid({ message: "Invalid tenant ID format" })
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

// Create client schema (excludes auto-generated fields)
export const ClientCreateSchema = ClientBaseSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

// Update client schema (all fields optional except those that shouldn't change)
export const ClientUpdateSchema = ClientBaseSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type ClientBase = z.infer<typeof ClientBaseSchema>;
export type ClientCreate = z.infer<typeof ClientCreateSchema>;
export type ClientUpdate = z.infer<typeof ClientUpdateSchema>;
export type ClientReponse = ClientBase;
export type ClientFormInputs = z.infer<typeof ClientCreateSchema>;
