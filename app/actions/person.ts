"use server";
import { prisma } from "@/lib/prisma";
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
      where: { tenantId: filter.tenantId, roles: { has: filter.role } },
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

export async function getPersonById(personId: string) {
  return prisma.person.findUnique({
    where: { id: personId },
  });
}
