"use server";
import { prisma } from "@/lib/prisma";

// Create a new withholding
export async function createWithholding(
  data: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const newWithholding = await prisma.withholding.create({
      data,
    });
    return { success: true, data: newWithholding };
  } catch (error) {
    return { success: false, error: "Error creating withholding" };
  }
}

// Update an existing withholding by ID
export async function updateWithholding(
  id: string,
  data: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const updatedWithholding = await prisma.withholding.update({
      where: { id },
      data,
    });

    return { success: true, data: updatedWithholding };
  } catch (error) {
    return { success: false, error: "Error updating withholding" };
  }
}

// Get a withholding by ID
export async function getWithholding(
  id: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const withholding = await prisma.withholding.findUnique({
      where: { id },
      include: {
        details: true,
      },
    });

    if (!withholding) {
      return { success: false, error: "Withholding not found" };
    }

    return { success: true, data: withholding };
  } catch (error) {
    return { success: false, error: "Error retrieving withholding" };
  }
}
