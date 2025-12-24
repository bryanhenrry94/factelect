"use server";
import { prisma } from "@/lib/prisma";
import { Tenant } from "@/lib/validations/tenant";
import { $Enums } from "@/prisma/generated/prisma";
import bcrypt from "bcrypt";

export async function createTenant(
  contributorType: $Enums.ContributorType,
  taxRegime: $Enums.TaxRegime,
  legalName: string,
  ruc: string,
  subdomain: string
) {
  return prisma.tenant.create({
    data: {
      contributorType,
      taxRegime,
      legalName,
      ruc,
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

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      tenantId,
      role: "USER",
    },
  });

  return;
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
    // Identidad
    legalName: tenant.legalName,
    tradeName: tenant.tradeName || tenant.legalName,
    ruc: tenant.ruc,
    subdomain: tenant.subdomain,
    // Datos fiscales
    contributorType: tenant.contributorType,
    taxRegime: tenant.taxRegime,
    obligatedAccounting: tenant.obligatedAccounting,
    isWithholdingAgent: tenant.isWithholdingAgent,
    isSpecialContributor: tenant.isSpecialContributor,
    specialContributorNumber: tenant.specialContributorNumber || undefined,
    economicActivity: tenant.economicActivity || undefined,
    // Contacto fiscal
    address: tenant.address || undefined,
    email: tenant.email || undefined,
    phone: tenant.phone || undefined,
    // Branding
    logoUrl: tenant.logoUrl || undefined,
    // Timestamps
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
        ruc: data.ruc,
        legalName: data.legalName,
        subdomain: data.subdomain,
        tradeName: data.tradeName,
        contributorType: data.contributorType,
        taxRegime: data.taxRegime,
        obligatedAccounting: data.obligatedAccounting,
        isWithholdingAgent: data.isWithholdingAgent,
        isSpecialContributor: data.isSpecialContributor,
        specialContributorNumber: data.specialContributorNumber,
        economicActivity: data.economicActivity,
        phone: data.phone,
        email: data.email,
        address: data.address,
        logoUrl: data.logoUrl,
      },
    });

    const formattedTenant: Tenant = {
      id: updatedTenant.id,
      // Identidad
      legalName: updatedTenant.legalName,
      tradeName: updatedTenant.tradeName || updatedTenant.legalName,
      ruc: updatedTenant.ruc,
      subdomain: updatedTenant.subdomain,
      // Datos fiscales
      contributorType: updatedTenant.contributorType,
      taxRegime: updatedTenant.taxRegime,
      obligatedAccounting: updatedTenant.obligatedAccounting,
      isWithholdingAgent: updatedTenant.isWithholdingAgent,
      isSpecialContributor: updatedTenant.isSpecialContributor,
      specialContributorNumber:
        updatedTenant.specialContributorNumber || undefined,
      economicActivity: updatedTenant.economicActivity || undefined,
      // Contacto fiscal
      address: updatedTenant.address || undefined,
      email: updatedTenant.email || undefined,
      phone: updatedTenant.phone || undefined,
      // Branding
      logoUrl: updatedTenant.logoUrl || undefined,
      // Timestamps
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
