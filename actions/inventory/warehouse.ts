"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateWarehouse,
  Warehouse,
} from "@/lib/validations/inventory/warehouse";

export const createWarehouse = async (
  tenantId: string,
  data: CreateWarehouse
): Promise<{ success: boolean; data: Warehouse; error?: string }> => {
  try {
    const warehouse = await prisma.warehouse.create({
      data: {
        ...data,
        costCenterId: data.costCenterId || null,
        tenantId,
      },
    });
    return { success: true, data: warehouse };
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return {
      success: false,
      data: null as any,
      error: "Error creating warehouse",
    };
  }
};

export const getWarehouses = async (
  tenantId: string,
  search?: string
): Promise<{ success: boolean; data: Warehouse[]; error?: string }> => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        tenantId,
        name: search ? { contains: search, mode: "insensitive" } : undefined,
      },
    });
    return { success: true, data: warehouses };
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return { success: false, data: [], error: "Error fetching warehouses" };
  }
};

export const getWarehouseById = async (
  warehouseId: string
): Promise<{ success: boolean; data?: Warehouse | null; error?: string }> => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    return { success: true, data: warehouse };
  } catch (error) {
    console.error("Error fetching warehouse by ID:", error);
    return {
      success: false,
      data: null,
      error: "Error fetching warehouse by ID",
    };
  }
};

export const updateWarehouse = async (
  warehouseId: string,
  data: Partial<Warehouse>
): Promise<{ success: boolean; data?: Warehouse; error?: string }> => {
  try {
    const warehouse = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        ...data,
        costCenterId: data.costCenterId || null,
      },
    });
    return { success: true, data: warehouse };
  } catch (error) {
    console.error("Error updating warehouse:", error);
    return { success: false, error: "Error updating warehouse" };
  }
};

export const deleteWarehouse = async (
  warehouseId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.warehouse.delete({
      where: { id: warehouseId },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    return { success: false, error: "Error deleting warehouse" };
  }
};
