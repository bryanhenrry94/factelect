"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateInventoryMovement,
  InventoryMovement,
} from "@/lib/validations/inventory/inventory-movement";

export const getInventoryMovements = async (
  tenantId: string,
  search?: string
): Promise<{
  success: boolean;
  data?: InventoryMovement[];
  error?: string;
}> => {
  try {
    const inventoryMovements = await prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        description: search
          ? { contains: search, mode: "insensitive" }
          : undefined,
      },
      include: {
        items: true,
      },
      orderBy: [{ date: "desc" }],
    });

    return { success: true, data: inventoryMovements };
  } catch (error) {
    console.error("Error fetching inventory movements:", error);
    return { success: false, error: "Error fetching inventory movements" };
  }
};

export const getInventoryMovementById = async (
  id: string
): Promise<{ success: boolean; data?: InventoryMovement; error?: string }> => {
  try {
    const inventoryMovement = await prisma.inventoryMovement.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!inventoryMovement) {
      return { success: false, error: "Inventory movement not found" };
    }

    return { success: true, data: inventoryMovement };
  } catch (error) {
    console.error("Error fetching inventory movement:", error);
    return { success: false, error: "Error fetching inventory movement" };
  }
};

export const createInventoryMovement = async (
  tenantId: string,
  data: CreateInventoryMovement
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    if (!data.items?.length) {
      return { success: false, error: "Debe agregar al menos un ítem." };
    }

    // validaciones mínimas...
    const result = await prisma.$transaction(async (tx) => {
      // 1. crear movimiento
      const movement = await tx.inventoryMovement.create({
        data: {
          tenantId,
          date: data.date,
          type: data.type,
          description: data.description,
          warehouseId: data.warehouseId,
        },
      });

      // 2. crear items
      const createdItems = [];
      for (const it of data.items) {
        // before inserting item, compute cost if OUT
        let itemCost = it.cost ?? 0;
        let itemTotalCost = it.totalCost ?? 0;

        // Obtener stock actual (si existe)
        const existing = await tx.stock.findFirst({
          where: {
            tenantId,
            warehouseId: data.warehouseId,
            productId: it.productId,
          },
          include: { product: true },
        });

        // Si es salida, asignar costo = avgCost del stock actual (si existe)
        if (data.type === "OUT") {
          if (!existing) {
            throw new Error(
              `Stock no encontrado para producto ${it.productId} en la bodega`
            );
          }
          // usa avgCost; si no existe avgCost, puedes decidir fallback (p.ej. product.cost)
          const avgCost = existing.avgCost
            ? Number(existing.avgCost)
            : Number(existing?.product?.cost ?? 0);
          itemCost = avgCost;
          itemTotalCost = Number((itemCost * it.quantity).toFixed(6));
        }

        // si es IN y no te pasaron cost, usa cost del item
        if (data.type === "IN") {
          itemCost = it.cost ?? 0;
          itemTotalCost = Number((itemCost * it.quantity).toFixed(6));
        }

        // crear item
        const createdItem = await tx.inventoryMovementItem.create({
          data: {
            tenantId,
            inventoryMoveId: movement.id,
            productId: it.productId,
            unitId: it.unitId,
            quantity: it.quantity,
            cost: itemCost,
            totalCost: itemTotalCost,
          },
        });

        createdItems.push(createdItem);

        // -------------------------
        // 3. actualizar stock usando promedio ponderado
        // -------------------------
        const qty = Number(it.quantity);
        if (existing) {
          const oldQty = Number(existing.quantity);
          const oldAvg = existing.avgCost ? Number(existing.avgCost) : 0;
          if (data.type === "IN") {
            // fórmula ponderada
            const inQty = qty;
            const inCost = Number(itemCost);
            const newQty = oldQty + inQty;
            const newTotalCost = oldQty * oldAvg + inQty * inCost;
            const newAvg = newQty > 0 ? newTotalCost / newQty : 0;

            await tx.stock.update({
              where: { id: existing.id },
              data: {
                quantity: newQty,
                avgCost: newAvg,
                totalCost: Number((newQty * newAvg).toFixed(6)),
              },
            });
          } else if (data.type === "OUT") {
            const newQty = oldQty - qty;
            if (newQty < 0) {
              // política: error o permitir negativo
              throw new Error(
                `Stock insuficiente para producto ${it.productId}`
              );
            }
            // avgCost permanece igual (en promedio ponderado)
            await tx.stock.update({
              where: { id: existing.id },
              data: {
                quantity: newQty,
                totalCost: Number((newQty * oldAvg).toFixed(6)),
                // opcional: if newQty === 0, avgCost = null
                avgCost: newQty === 0 ? null : oldAvg,
              },
            });
          } else if (data.type === "ADJUST") {
            // aplica lógica según si adjust es positivo o negativo
            const delta = qty; // espera que signifique +/-
            const newQty = oldQty + delta;
            // si ajuste positivo incluye costo: it.cost debe venir definido
            if (delta > 0) {
              const inCost = Number(itemCost);
              const newTotalCost = oldQty * oldAvg + delta * inCost;
              const newAvg = newQty > 0 ? newTotalCost / newQty : 0;
              await tx.stock.update({
                where: { id: existing.id },
                data: {
                  quantity: newQty,
                  avgCost: newAvg,
                  totalCost: Number((newQty * newAvg).toFixed(6)),
                },
              });
            } else {
              // ajuste negativo: consume a avg
              const newTotal = newQty * oldAvg;
              if (newQty < 0)
                throw new Error("Stock insuficiente (ajuste negativo)");
              await tx.stock.update({
                where: { id: existing.id },
                data: {
                  quantity: newQty,
                  totalCost: Number((newQty * oldAvg).toFixed(6)),
                  avgCost: newQty === 0 ? null : oldAvg,
                },
              });
            }
          } else if (data.type === "TRANSFER") {
            // TRATAMIENTO ESPECIAL: hacer OUT en origen y luego IN en destino (ver punto 7)
          }
        } else {
          // no existe stock -> crear
          const delta = data.type === "IN" ? qty : -qty;
          const avg = data.type === "IN" ? Number(itemCost) : null; // si OUT sin stock: considera error
          if (data.type === "OUT") {
            throw new Error(
              `Stock no encontrado para producto ${it.productId} en la bodega`
            );
          }
          await tx.stock.create({
            data: {
              tenantId,
              warehouseId: data.warehouseId,
              productId: it.productId,
              quantity: delta,
              avgCost: avg,
              totalCost: Number((delta * (avg ?? 0)).toFixed(6)),
            },
          });
        }
      } // end for items

      // retornar movimiento con items
      return tx.inventoryMovement.findUnique({
        where: { id: movement.id },
        include: {
          items: { include: { product: true, unit: true } },
          warehouse: true,
        },
      });
    }); // end transaction

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error createInventoryMovement:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
};

export const updateInventoryMovement = async (
  id: string,
  data: Partial<InventoryMovement>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    if (data.items && data.items.length === 0) {
      return { success: false, error: "Debe agregar al menos un ítem." };
    }

    if (data.items) {
      const invalidItem = data.items.find(
        (i) => !i.productId || i.quantity <= 0
      );
      if (invalidItem) {
        return {
          success: false,
          error: "Todos los ítems deben tener producto y cantidad válida.",
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Actualizar cabecera
      const header = await tx.inventoryMovement.update({
        where: { id },
        data: {
          date: data.date,
          type: data.type,
          description: data.description,
          warehouseId: data.warehouseId,
        },
      });

      // 2️⃣ Eliminar detalle anterior
      await tx.inventoryMovementItem.deleteMany({
        where: { inventoryMoveId: id },
      });

      // 3️⃣ Insertar nuevo detalle
      if (data.items && data.items.length > 0) {
        await tx.inventoryMovementItem.createMany({
          data: data.items.map((item) => ({
            inventoryMoveId: id,
            productId: item.productId!,
            unitId: item.unitId!,
            quantity: item.quantity!,
            cost: item.cost ?? 0,
            totalCost: item.totalCost ?? 0,
            tenantId: header.tenantId,
          })),
        });
      }

      // 4️⃣ RECALCULAR COSTOS Y STOCK (PROMEDIO PONDERADO)

      // Obtener productos afectados para minimizar cálculos
      const affectedItems = await tx.inventoryMovementItem.findMany({
        where: { inventoryMoveId: id },
      });

      const affectedProductIds = [
        ...new Set(affectedItems.map((i) => i.productId)),
      ];

      for (const productId of affectedProductIds) {
        // Obtener todos los movimientos históricos del producto en la bodega
        const movements = await tx.inventoryMovement.findMany({
          where: {
            warehouseId: header.warehouseId,
            items: { some: { productId } },
          },
          include: { items: true },
          orderBy: [{ date: "asc" }],
        });

        let balanceQty = 0;
        let avgCost = 0;

        for (const mv of movements) {
          for (const item of mv.items.filter(
            (i) => i.productId === productId
          )) {
            if (mv.type === "IN") {
              const totalPrev = balanceQty * avgCost;
              const totalNew = item.quantity * item.cost;

              balanceQty += item.quantity;
              avgCost =
                balanceQty === 0 ? 0 : (totalPrev + totalNew) / balanceQty;

              // Actualizo el costo del ingreso
              await tx.inventoryMovementItem.update({
                where: { id: item.id },
                data: {
                  cost: item.cost,
                  totalCost: item.quantity * item.cost,
                },
              });
            }

            if (mv.type === "OUT") {
              // Egreso usa el costo promedio actual
              const salidaCost = avgCost;

              await tx.inventoryMovementItem.update({
                where: { id: item.id },
                data: {
                  cost: salidaCost,
                  totalCost: salidaCost * item.quantity,
                },
              });

              balanceQty -= item.quantity;
              if (balanceQty < 0) balanceQty = 0; // seguridad
            }

            // (Puedes añadir TRANSFERENCIA si aplica)
          }
        }
      }

      // 5️⃣ Retornar resultado final
      return tx.inventoryMovement.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
              unit: true,
            },
          },
          warehouse: true,
        },
      });
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating inventory movement:", error);
    return {
      success: false,
      error: "Error inesperado al actualizar el movimiento.",
    };
  }
};

export const deleteInventoryMovement = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Obtener movimiento antes de eliminar (para saber productos, bodega, fecha)
      const movement = await tx.inventoryMovement.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!movement) {
        return { success: false, error: "Movimiento no encontrado" };
      }

      const warehouseId = movement.warehouseId;
      const affectedProductIds = [
        ...new Set(movement.items.map((i) => i.productId)),
      ];

      // 2️⃣ Eliminar ITEMS primero (integridad)
      await tx.inventoryMovementItem.deleteMany({
        where: { inventoryMoveId: id },
      });

      // 3️⃣ Eliminar cabecera del movimiento
      await tx.inventoryMovement.delete({
        where: { id },
      });

      // 4️⃣ Recalcular STOCK y COSTO PROMEDIO desde el inicio
      for (const productId of affectedProductIds) {
        const movements = await tx.inventoryMovement.findMany({
          where: {
            warehouseId,
            items: { some: { productId } },
          },
          include: { items: true },
          orderBy: [{ date: "asc" }],
        });

        let balanceQty = 0;
        let avgCost = 0;

        for (const mv of movements) {
          const mvItems = mv.items.filter((i) => i.productId === productId);

          for (const item of mvItems) {
            // INGRESO
            if (mv.type === "IN") {
              const prevTotal = balanceQty * avgCost;
              const newTotal = item.quantity * item.cost;

              balanceQty += item.quantity;
              avgCost =
                balanceQty === 0 ? 0 : (prevTotal + newTotal) / balanceQty;

              // Costos correctos de ingreso
              await tx.inventoryMovementItem.update({
                where: { id: item.id },
                data: {
                  cost: item.cost,
                  totalCost: item.quantity * item.cost,
                },
              });
            }

            // EGRESO
            if (mv.type === "OUT") {
              const salidaCost = avgCost;

              await tx.inventoryMovementItem.update({
                where: { id: item.id },
                data: {
                  cost: salidaCost,
                  totalCost: salidaCost * item.quantity,
                },
              });

              balanceQty -= item.quantity;
              if (balanceQty < 0) balanceQty = 0; // seguridad
            }
          }
        }
      }

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error("Error deleting inventory movement:", error);
    return {
      success: false,
      error: "Error eliminando el movimiento de inventario.",
    };
  }
};
