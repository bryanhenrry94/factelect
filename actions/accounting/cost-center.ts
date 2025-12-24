"use server";
import { prisma } from "@/lib/prisma";
import {
  CostCenter,
  CreateCostCenterInput,
  UpdateCostCenterInput,
} from "@/lib/validations/accounting/cost-center";

export async function getCostCenters(
  tenantId: string,
  search?: string
): Promise<{ success: boolean; data?: CostCenter[]; error?: string }> {
  try {
    const costCenters = await prisma.costCenter.findMany({
      where: {
        tenantId,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
    });

    return { success: true, data: costCenters };
  } catch (error) {
    console.error("Error fetching cost centers:", error);
    return { success: false, error: "Error fetching cost centers" };
  }
}

export async function createCostCenter(
  tenantId: string,
  input: CreateCostCenterInput
): Promise<{ success: boolean; data?: CostCenter; error?: string }> {
  try {
    const newCostCenter = await prisma.costCenter.create({
      data: { ...input, tenantId },
    });
    return { success: true, data: newCostCenter };
  } catch (error) {
    console.error("Error creating cost center:", error);
    return { success: false, error: "Error creating cost center" };
  }
}

export async function updateCostCenter(
  id: string,
  input: UpdateCostCenterInput
): Promise<{ success: boolean; data?: CostCenter; error?: string }> {
  try {
    const updatedCostCenter = await prisma.costCenter.update({
      where: { id },
      data: input,
    });

    return { success: true, data: updatedCostCenter };
  } catch (error) {
    console.error("Error updating cost center:", error);
    return { success: false, error: "Error updating cost center" };
  }
}

export async function deleteCostCenter(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.costCenter.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting cost center:", error);
    return { success: false, error: "Error deleting cost center" };
  }
}
