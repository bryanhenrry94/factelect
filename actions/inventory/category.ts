"use server";
import { prisma } from "@/lib/prisma";
import {
  Category,
  CreateCategory,
  UpdateCategory,
} from "@/lib/validations/inventory/category";

// crud
export const createCategory = async (
  tenantId: string,
  data: CreateCategory
): Promise<{ success: boolean; data?: { id: string }; error?: string }> => {
  try {
    const newCategory = await prisma.category.create({
      data: {
        tenantId,
        name: data.name,
      },
    });

    return { success: true, data: { id: newCategory.id } };
  } catch (error) {
    return { success: false, error: "Error al crear la categoría" };
  }
};

export const getAllCategories = async (
  tenantId: string,
  search?: string
): Promise<{ success: boolean; data?: Category[]; error?: string }> => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        tenantId,
        name: search
          ? {
              contains: search,
              mode: "insensitive",
            }
          : undefined,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: "Error al obtener las categorías" };
  }
};

export const updateCategory = async (
  id: string,
  data: UpdateCategory
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("Updating category:", id, data);
    await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar la categoría" };
  }
};

export const deleteCategory = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.category.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar la categoría" };
  }
};
