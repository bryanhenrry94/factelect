"use server";
import { prisma } from "@/lib/prisma";
import { Tenant } from "@/lib/validations/tenant";
import bcrypt from "bcrypt";

export async function createTenant(name: string, subdomain: string) {
  return prisma.tenant.create({
    data: {
      name,
      subdomain,
    },
  });
}

export async function createUser(
  email: string,
  password: string,
  tenantId: string,
  name?: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      tenantId,
      name,
    },
  });
}

export const getTenantById = async (
  id: string
): Promise<{ success: boolean; data: Tenant | null; error?: string }> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });
  if (!tenant) {
    return { success: false, error: "Tenant not found", data: null };
  }

  const formattedTenant: Tenant = {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    legalName: tenant.legalName || undefined,
    ruc: tenant.ruc || undefined,
    phone: tenant.phone || undefined,
    contactEmail: tenant.contactEmail || undefined,
    address: tenant.address || undefined,
    logoUrl: tenant.logoUrl || undefined,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };

  return { success: true, data: formattedTenant };
};

export const updateTenant = async (
  id: string,
  data: Partial<Tenant>
): Promise<{ success: boolean; data?: Tenant; error?: string }> => {
  try {
    const updatedTenant = await prisma.tenant.update({
      where: { id },
      data: {
        name: data.name,
        subdomain: data.subdomain,
        legalName: data.legalName,
        ruc: data.ruc,
        phone: data.phone,
        contactEmail: data.contactEmail,
        address: data.address,
        logoUrl: data.logoUrl,
      },
    });

    const formattedTenant: Tenant = {
      id: updatedTenant.id,
      name: updatedTenant.name,
      subdomain: updatedTenant.subdomain,
      legalName: updatedTenant.legalName || undefined,
      ruc: updatedTenant.ruc || undefined,
      phone: updatedTenant.phone || undefined,
      contactEmail: updatedTenant.contactEmail || undefined,
      address: updatedTenant.address || undefined,
      logoUrl: updatedTenant.logoUrl || undefined,
      createdAt: updatedTenant.createdAt,
      updatedAt: updatedTenant.updatedAt,
    };

    return { success: true, data: formattedTenant };
  } catch (error) {
    return { success: false, error: "Failed to update tenant" };
  }
};

export const updateLogoUrl = async (
  tenantId: string,
  logoUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { logoUrl },
    });

    // revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error updating logo URL:", error);
    return { success: false, error: "Error updating logo URL." };
  }
};
