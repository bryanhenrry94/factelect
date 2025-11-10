"use server";
import { prisma } from "./prisma";

export async function getTenantBySubdomain(subdomain: string) {  
  if (!subdomain) throw new Error("No subdomain provided");
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });
  if (!tenant) throw new Error("Tenant not found");
  return tenant;
}
