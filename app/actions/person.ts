"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma";
import {
  CreatePersonInput,
  createPersonSchema,
  PersonInput,
  UpdatePersonInput,
  updatePersonSchema,
} from "@/lib/validations/person";
import { $Enums } from "@/prisma/generated/prisma";
import { PersonFilter } from "@/types";

export async function createPerson(
  data: CreatePersonInput,
  tenantId: string
): Promise<{ success: boolean; data?: PersonInput; error?: string }> {
  try {
    if (!data) {
      return { success: false, error: "Invalid customer data" };
    }

    const parsed = createPersonSchema.parse(data);
    if (!parsed) {
      return { success: false, error: "Invalid customer data" };
    }

    // Verificar si ya existe una persona con la misma identificación en el mismo tenant
    const existing = await prisma.person.findFirst({
      where: { identification: parsed.identification, tenantId },
    });
    if (existing) {
      return { success: false, error: "La identificación ya existe" };
    }

    // Verificar si ya existe una persona con el mismo email (email es único en el esquema)
    if (parsed.email) {
      const emailExists = await prisma.person.findUnique({
        where: { email: parsed.email },
      });
      if (emailExists) {
        return { success: false, error: "El correo electrónico ya está registrado" };
      }
    }

    const person = await prisma.person.create({
      data: {
        ...parsed,
        identificationType:
          parsed.identificationType as $Enums.IdentificationType,
        tenantId,
      },
    });

    return { success: true, data: person };
  } catch (error) {
    console.error("Error creating customer:", error);
    // Manejar error de constraint único (identification, email)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta as any)?.target;
      if (Array.isArray(target) && target.includes("identification")) {
        return { success: false, error: "La identificación ya existe" };
      }
      if (Array.isArray(target) && target.includes("email")) {
        return { success: false, error: "El correo electrónico ya está registrado" };
      }
      return { success: false, error: "Violación de restricción única en la base de datos" };
    }

    return { success: false, error: "Hubo un error al crear el cliente" };
  }
}

export async function updatePerson(
  personId: string,
  data: Partial<UpdatePersonInput>
): Promise<{ success: boolean; data?: PersonInput; error?: string }> {
  try {
    if (!data) {
      return { success: false, error: "Invalid customer data" };
    }

    const parsed = updatePersonSchema.parse(data);

    if (!parsed) {
      return { success: false, error: "Invalid customer data" };
    }

    // Si se está actualizando la identificación, verificar duplicado
    if (data.identification) {
      const existing = await prisma.person.findFirst({
        where: { identification: data.identification },
      });
      if (existing && existing.id !== personId) {
        return { success: false, error: "La identificación ya existe" };
      }
    }

    // Si se está actualizando el email, verificar duplicado
    if (data.email) {
      const emailExisting = await prisma.person.findUnique({
        where: { email: data.email },
      });
      if (emailExisting && emailExisting.id !== personId) {
        return { success: false, error: "El correo electrónico ya está registrado" };
      }
    }

    const person = await prisma.person.update({
      where: { id: personId },
      data: {
        ...data,
        identificationType:
          data.identificationType as $Enums.IdentificationType,
      },
    });

    return { success: true, data: person };
  } catch (error) {
    console.error("Error updating person:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta as any)?.target;
      if (Array.isArray(target) && target.includes("identification")) {
        return { success: false, error: "La identificación ya existe" };
      }
      if (Array.isArray(target) && target.includes("email")) {
        return { success: false, error: "El correo electrónico ya está registrado" };
      }
      return { success: false, error: "Violación de restricción única en la base de datos" };
    }

    return { success: false, error: "Hubo un error al actualizar el cliente" };
  }
}

export async function deletePerson(personId: string) {
  return prisma.person.delete({
    where: { id: personId },
  });
}

export async function getPersonsByTenant(
  filter: PersonFilter
): Promise<{ success: boolean; data: PersonInput[] }> {
  try {
    const persons = await prisma.person.findMany({
      where: { tenantId: filter.tenantId },
      orderBy: { createdAt: "desc" },
    });

    const formattedPersons = persons.map((person) => ({
      ...person,
      identificationType:
        person.identificationType as $Enums.IdentificationType,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
    }));

    return { success: true, data: formattedPersons };
  } catch (error) {
    console.error("Error fetching persons:", error);
    return { success: false, data: [] };
  }
}

export async function getPersonById(customerId: string) {
  return prisma.person.findUnique({
    where: { id: customerId },
  });
}
