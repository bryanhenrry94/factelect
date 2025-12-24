"use server";
import { prisma } from "@/lib/prisma";
import { Establishment } from "@/lib/validations/e-invoicing/establishment";

export const getEstablishments = async (
  tenantId: string
): Promise<{ success: boolean; data?: Establishment[]; error?: string }> => {
  try {
    const establishments = await prisma.establishment.findMany({
      where: { tenantId },
    });
    return { success: true, data: establishments };
  } catch (error) {
    return { success: false, error: "Failed to fetch establishments." };
  }
};

export const createEstablishment = async (
  tenantId: string,
  establishmentData: Omit<Establishment, "id">
): Promise<{ success: boolean; data?: Establishment; error?: string }> => {
  try {
    const newEstablishment = await prisma.establishment.create({
      data: {
        ...establishmentData,
        tenantId,
      },
    });
    return { success: true, data: newEstablishment };
  } catch (error) {
    console.error("Error creating establishment:", error);
    return { success: false, error: "Failed to create establishment." };
  }
};

export const updateEstablishment = async (
  id: string,
  establishmentData: Partial<Omit<Establishment, "id">>
): Promise<{ success: boolean; data?: Establishment; error?: string }> => {
  try {
    const updatedEstablishment = await prisma.establishment.update({
      where: { id },
      data: establishmentData,
    });
    return { success: true, data: updatedEstablishment };
  } catch (error) {
    return { success: false, error: "Failed to update establishment." };
  }
};

export const deleteEstablishment = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.establishment.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete establishment." };
  }
};

export const getEstablishmentsByTenant = async (
  tenantId: string
): Promise<{ success: boolean; data: Establishment[]; error?: string }> => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { sriConfiguration: true },
    });

    if (!tenant || !tenant.sriConfiguration) {
      return { success: false, error: "Tenant not found.", data: [] };
    }

    const establishments = await prisma.establishment.findMany({
      where: { tenantId: tenant.sriConfiguration?.id },
    });

    return { success: true, data: establishments };
  } catch (error) {
    return {
      success: false,
      error: "Failed to fetch establishments.",
      data: [],
    };
  }
};
