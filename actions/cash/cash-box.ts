"use server";
import { prisma } from "@/lib/prisma";
import {
  CashBox,
  CreateCashBox,
  UpdateCashBox,
} from "@/lib/validations/cash/cash_box";

export const getAllCashBoxes = async (
  tenantId: string,
  search?: string
): Promise<{ success: boolean; data?: CashBox[]; error?: string }> => {
  try {
    const where: any = {
      tenantId, // Siempre obligatorio
    };

    // Solo aplica OR si search tiene valor real
    if (search && search.trim() !== "") {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
      ];
    }

    const cashBoxes = await prisma.cashBox.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: cashBoxes };
  } catch (error) {
    console.error("Error fetching cash boxes:", error);
    return { success: false, error: "Error fetching cash boxes" };
  }
};

export const deleteCashBox = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.cashBox.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error deleting cash box" };
  }
};

export const createCashBox = async (
  tenantId: string,
  data: CreateCashBox
): Promise<{ success: boolean; data?: CashBox; error?: string }> => {
  try {
    const newCashBox = await prisma.cashBox.create({
      data: { ...data, tenantId },
    });
    return { success: true, data: newCashBox };
  } catch (error) {
    return { success: false, error: "Error creating cash box" };
  }
};

export const updateCashBox = async (
  id: string,
  data: Partial<UpdateCashBox>
): Promise<{ success: boolean; data?: CashBox; error?: string }> => {
  try {
    const updatedCashBox = await prisma.cashBox.update({
      where: { id },
      data,
    });
    return { success: true, data: updatedCashBox };
  } catch (error) {
    return { success: false, error: "Error updating cash box" };
  }
};
