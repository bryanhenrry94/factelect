"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateProduct,
  createProductSchema,
  Product,
  UpdateProduct,
} from "@/lib/validations/inventory/product";
import { $Enums } from "@/prisma/generated/prisma";

export async function createProduct(
  data: CreateProduct,
  tenantId: string
): Promise<{ success: boolean; data?: Product; error?: string }> {
  try {
    const parsed = createProductSchema.parse(data);
    if (!tenantId) {
      return { success: false, error: "Tenant ID is required" };
    }

    const codeExists = await prisma.product.findUnique({
      where: { tenantId_code: { tenantId, code: parsed.code } },
    });

    if (codeExists) {
      return {
        success: false,
        error: `Producto con codigo ${parsed.code} ya existe`,
      };
    }

    const product = await prisma.product.create({
      data: {
        ...parsed,
        tenantId,
        barcode: parsed.barcode || null,
      },
    });

    return { success: true, data: product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Error creating product" };
  }
}

export async function updateProduct(
  productId: string,
  data: Partial<UpdateProduct>
): Promise<{ success: boolean; data?: Product; error?: string }> {
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
      },
    });

    return { success: true, data: product };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Error updating product" };
  }
}

export const deleteProduct = async (
  productId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Error deleting product" };
  }
};

export async function getProductById(
  productId: string
): Promise<{ success: boolean; data?: Product; error?: string }> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { success: false, error: "Error fetching product" };
  }
}

export async function getAllProducts(
  tenantId: string,
  search?: string,
  type?: $Enums.ProductType
): Promise<{ success: boolean; data: Product[]; error?: string }> {
  try {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { description: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),

        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Error fetching products", data: [] };
  }
}
