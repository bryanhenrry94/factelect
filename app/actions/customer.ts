"use server";
import { prisma } from "@/lib/prisma";
import {
  CustomerCreate,
  CustomerCreateSchema,
  CustomerReponse,
  CustomerUpdate,
  CustomerUpdateSchema,
} from "@/lib/validations/customer";
import { $Enums } from "@/prisma/generated/prisma";

export async function createCustomer(
  data: CustomerCreate,
  tenantId: string
): Promise<{ success: boolean; data?: CustomerReponse; error?: string }> {
  try {
    if (!data) {
      return { success: false, error: "Invalid customer data" };
    }

    const parsed = CustomerCreateSchema.parse(data);
    if (!parsed) {
      return { success: false, error: "Invalid customer data" };
    }

    const customer = await prisma.customer.create({
      data: {
        ...parsed,
        identificationType:
          parsed.identificationType as $Enums.IdentificationType,
        tenantId,
      },
    });

    return { success: true, data: customer };
  } catch (error) {
    console.error("Error creating customer:", error);
    return { success: false, error: "Hubo un error al crear el cliente" };
  }
}

export async function updateCustomer(
  customerId: string,
  data: Partial<CustomerUpdate>
): Promise<{ success: boolean; data?: CustomerReponse; error?: string }> {
  try {
    if (!data) {
      return { success: false, error: "Invalid customer data" };
    }

    const parsed = CustomerUpdateSchema.parse(data);

    if (!parsed) {
      return { success: false, error: "Invalid customer data" };
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...data,
        identificationType:
          data.identificationType as $Enums.IdentificationType,
      },
    });

    return { success: true, data: customer };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { success: false, error: "Hubo un error al actualizar el cliente" };
  }
}

export async function deleteCustomer(customerId: string) {
  return prisma.customer.delete({
    where: { id: customerId },
  });
}

export async function getCustomersByTenant(
  tenantId: string
): Promise<{ success: boolean; data: CustomerReponse[] }> {
  try {
    const clients = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const formattedClients = clients.map((customer) => ({
      ...customer,
      identificationType:
        customer.identificationType as $Enums.IdentificationType,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));

    return { success: true, data: formattedClients };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return { success: false, data: [] };
  }
}

export async function getCustomerById(customerId: string) {
  return prisma.customer.findUnique({
    where: { id: customerId },
  });
}
