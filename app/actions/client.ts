"use server";
import { prisma } from "@/lib/prisma";
import {
  ClientCreate,
  ClientCreateSchema,
  ClientReponse,
  ClientUpdate,
  ClientUpdateSchema,
} from "@/lib/validations/client";
import { $Enums } from "@/prisma/generated/prisma";

export async function createClient(
  data: ClientCreate,
  tenantId: string
): Promise<{ success: boolean; data?: ClientReponse; error?: string }> {
  try {
    if (!data) {
      return { success: false, error: "Invalid client data" };
    }

    const parsed = ClientCreateSchema.parse(data);
    if (!parsed) {
      return { success: false, error: "Invalid client data" };
    }

    const client = await prisma.client.create({
      data: {
        ...parsed,
        identificationType:
          parsed.identificationType as $Enums.IdentificationType,
        tenantId,
      },
    });

    return { success: true, data: client };
  } catch (error) {
    console.error("Error creating client:", error);
    return { success: false, error: "Hubo un error al crear el cliente" };
  }
}

export async function updateClient(
  clientId: string,
  data: Partial<ClientUpdate>
): Promise<{ success: boolean; data?: ClientReponse; error?: string }> {
  try {
    if (!data) {
      return { success: false, error: "Invalid client data" };
    }

    const parsed = ClientUpdateSchema.parse(data);

    if (!parsed) {
      return { success: false, error: "Invalid client data" };
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...data,
        identificationType:
          data.identificationType as $Enums.IdentificationType,
      },
    });

    return { success: true, data: client };
  } catch (error) {
    console.error("Error updating client:", error);
    return { success: false, error: "Hubo un error al actualizar el cliente" };
  }
}

export async function deleteClient(clientId: string) {
  return prisma.client.delete({
    where: { id: clientId },
  });
}

export async function getClientsByTenant(
  tenantId: string
): Promise<{ success: boolean; data: ClientReponse[] }> {
  try {
    const clients = await prisma.client.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const formattedClients = clients.map((client) => ({
      ...client,
      identificationType:
        client.identificationType as $Enums.IdentificationType,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));

    return { success: true, data: formattedClients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { success: false, data: [] };
  }
}

export async function getClientById(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
  });
}
