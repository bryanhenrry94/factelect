import { $Enums } from "@/prisma/generated/prisma";
import { z } from "zod";

export const PersonKindEnum = z.enum(["NATURAL", "LEGAL"]);
export const IdentificationTypeEnum = z.enum([
  "RUC",
  "CEDULA",
  "PASAPORTE",
  "VENTA_A_CONSUMIDOR_FINAL",
  "IDENTIFICACION_DE_EXTERIOR",
  "PLACA",
]);
export const PersonRoleEnum = z.enum(["CLIENT", "SUPPLIER", "SELLER"]);

export const personSchema = z
  .object({
    id: z.cuid(),
    personKind: PersonKindEnum, // "Natural" | "Legal"
    identificationType: IdentificationTypeEnum,
    identification: z.string().min(1, "La identificación es obligatoria"),

    // Campos que pueden ser opcionales, pero serán validados dinámicamente
    firstName: z.string().optional().nullable(),
    lastName: z.string().optional().nullable(),
    businessName: z.string().optional().nullable(),
    commercialName: z.string().optional().nullable(),

    email: z.email("El formato del correo electrónico es inválido"),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    roles: z.array(PersonRoleEnum).min(1, "Debe seleccionar al menos un rol"),
    accountReceivableId: z.string().optional().nullable(),
    accountPayableId: z.string().optional().nullable(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    tenantId: z.cuid(),
  })
  .superRefine((data, ctx) => {
    console.log("Validating person data:", data);
    // 👉 Validación para persona natural
    if (data.personKind === $Enums.PersonKind.NATURAL) {
      if (!data.firstName || data.firstName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El campo nombre es obligatorio para personas naturales",
          path: ["firstName"],
        });
      }

      if (!data.lastName || data.lastName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El campo apellido es obligatorio para personas naturales",
          path: ["lastName"],
        });
      }
    }

    // 👉 Validación para persona jurídica
    if (data.personKind === $Enums.PersonKind.LEGAL) {
      if (!data.businessName || data.businessName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La razón social es obligatoria para personas jurídicas",
          path: ["businessName"],
        });
      }
    }
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
