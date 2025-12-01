"use server";
import { prisma } from "@/lib/prisma";
import { Stock } from "@/lib/validations/inventory/stock";

export const getStockByProductAndWarehouse = async (
  productId: string,
  warehouseId: string
): Promise<{
  success: boolean;
  data?: Stock | null;
  error?: string;
}> => {
  try {
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });

    const formattedStock = stock
      ? {
          ...stock,
          quantity: stock.quantity.toNumber(),
          minQuantity: stock.minQuantity.toNumber(),
          avgCost: stock.avgCost ? stock.avgCost.toNumber() : 0,
          totalCost: stock.totalCost ? stock.totalCost.toNumber() : 0,
        }
      : null;

    return { success: true, data: formattedStock };
  } catch (error) {
    console.error("Error fetching stock:", error);
    return { success: false, data: null, error: "Error fetching stock" };
  }
};
