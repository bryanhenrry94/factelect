"use server";
import { prisma } from "@/lib/prisma";
import { Movement } from "@/lib/validations";

export const getMovements = async (
  tenantId: string
): Promise<{ success: boolean; data?: Movement[]; error?: string }> => {
  try {
    const movements = await prisma.movement.findMany({
      where: { tenantId },
    });
    return { success: true, data: movements };
  } catch (error) {
    return { success: false, error: "Failed to fetch movements." };
  }
};

export const createMovement = async (
  movementData: any
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const newMovement = await prisma.movement.create({
      data: {
        ...movementData,
      },
    });
    return { success: true, data: newMovement };
  } catch (error) {
    console.error("Error creating movement:", error);
    return { success: false, error: "Failed to create movement." };
  }
};

export const updateMovement = async (
  id: string,
  movementData: any
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const updatedMovement = await prisma.movement.update({
      where: { id },
      data: movementData,
    });
    return { success: true, data: updatedMovement };
  } catch (error) {
    return { success: false, error: "Failed to update movement." };
  }
};

export const deleteMovement = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.movement.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete movement." };
  }
};
