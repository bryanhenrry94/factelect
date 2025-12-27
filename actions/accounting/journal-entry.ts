"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateJournalEntry,
  JournalEntry,
  JournalEntryResponse,
} from "@/lib/validations/accounting/journal_entry";
import { $Enums, Prisma } from "@/prisma/generated/prisma";

export interface JournalEntryFilter {
  tenantId: string;
  search?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: $Enums.EntryType;
}

export const getJournalEntries = async (
  params: JournalEntryFilter
): Promise<{
  success: boolean;
  data?: JournalEntryResponse[];
  error?: string;
}> => {
  try {
    const where: Prisma.JournalEntryWhereInput = {
      tenantId: params.tenantId,
    };

    // 🔍 Search en descripción
    if (params.search?.trim()) {
      where.description = {
        contains: params.search.trim(),
        mode: "insensitive",
      };
    }

    // 🧾 Tipo de asiento
    if (params.type) {
      where.type = params.type;
    }

    // 📅 Rango de fechas
    if (params.dateFrom || params.dateTo) {
      where.date = {
        ...(params.dateFrom && { gte: new Date(params.dateFrom) }),
        ...(params.dateTo && {
          lte: new Date(params.dateTo + "T23:59:59.999Z"),
        }),
      };
    }

    // 🧮 Filtro por cuenta contable (en líneas)
    if (params.accountId) {
      where.lines = {
        some: {
          accountId: params.accountId,
        },
      };
    }

    const journalEntries = await prisma.journalEntry.findMany({
      where,
      include: {
        lines: {
          include: {
            account: true,
            costCenter: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const formatted: JournalEntryResponse[] = journalEntries.map((je) => ({
      id: je.id,
      tenantId: je.tenantId,
      date: je.date,
      type: je.type,
      description: je.description || undefined,
      sourceType: je.sourceType || undefined,
      sourceId: je.sourceId || undefined,
      createdAt: je.createdAt,
      updatedAt: je.updatedAt,
      lines: je.lines.map((e) => ({
        id: e.id,
        tenantId: e.tenantId,
        journalEntryId: e.journalEntryId,
        accountId: e.accountId,
        debit: e.debit.toNumber() || 0,
        credit: e.credit.toNumber() || 0,
        createdAt: e.createdAt,
        personId: e.personId,
        costCenterId: e.costCenterId,
        account: e.account || undefined,
        costCenter: e.costCenter || undefined,
      })),
    }));

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return { success: false, error: "Error fetching journal entries" };
  }
};

export const getJournalEntryById = async (
  id: string
): Promise<{ success: boolean; data?: JournalEntry; error?: string }> => {
  try {
    const journalEntry = await prisma.journalEntry.findFirst({
      where: { id },
      include: { lines: true },
    });

    if (!journalEntry) {
      return { success: false, error: "Journal entry not found" };
    }

    const formatted: JournalEntry = {
      ...journalEntry,
      createdAt: journalEntry.createdAt,
      updatedAt: journalEntry.updatedAt,
      description: journalEntry.description || undefined,
      sourceType: journalEntry.sourceType || undefined,
      sourceId: journalEntry.sourceId || undefined,
      lines: journalEntry.lines.map((e) => ({
        ...e,
        accountId: e.accountId,
        debit: e.debit.toNumber(),
        credit: e.credit.toNumber(),
        costCenterId: e.costCenterId,
        personId: e.personId,
        createdAt: e.createdAt,
      })),
    };
    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    return { success: false, error: "Error fetching journal entry" };
  }
};

export const deleteJournalEntry = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Validar existencia
      const movement = await tx.journalEntry.findUnique({
        where: { id },
      });

      if (!movement) {
        throw new Error("Asiento contable no encontrado");
      }

      // Validar que no este referenciado en contabilizacion de documentos
      if (movement.sourceType === "DOCUMENT" && movement.sourceId) {
        const linkedDocument = await tx.document.findUnique({
          where: { id: movement.sourceId },
        });

        if (linkedDocument) {
          throw new Error(
            "No se puede eliminar un asiento contable asociado a un documento"
          );
        }
      }

      // 2️⃣ Validar que no esté referenciado en movimientos de caja
      const hasCashMovement = await tx.cashMovement.findFirst({
        where: { journalEntryId: id },
      });

      if (hasCashMovement) {
        throw new Error(
          "No se puede eliminar un asiento contable asociado a un movimiento de caja"
        );
      }

      // 3️⃣ Validar que no esté referenciado en movimientos bancarios
      const hasBankMovement = await tx.bankMovement.findFirst({
        where: { journalEntryId: id },
      });

      if (hasBankMovement) {
        throw new Error(
          "No se puede eliminar un asiento contable asociado a un movimiento bancario"
        );
      }

      // proceder a eliminar
      // eliminar ledger lines asociados
      await tx.journalEntryLine.deleteMany({
        where: { journalEntryId: id },
      });

      // eliminar el journal entry
      await tx.journalEntry.delete({
        where: { id },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting journal entry:", error);
    return {
      success: false,
      error: error.message || "Error al eliminar el asiento contable",
    };
  }
};

export const createJournalEntry = async (
  tenantId: string,
  data: CreateJournalEntry
) => {
  try {
    const result = await prisma.$transaction((tx) =>
      createJournalEntryTx(tx, tenantId, data)
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

export const createJournalEntryTx = async (
  tx: Prisma.TransactionClient,
  tenantId: string,
  data: CreateJournalEntry
): Promise<{ success: boolean; data?: JournalEntry; error?: string }> => {
  try {
    // ------------------------------
    // VALIDACIONES
    // ------------------------------

    if (!data.lines?.length) {
      return {
        success: false,
        error: "El asiento debe tener al menos un detalle",
      };
    }

    if (!data.lines || data.lines.length === 0) {
      return {
        success: false,
        error: "El asiento debe tener al menos un detalle",
      };
    }

    const totalDebit = data.lines.reduce((sum, e) => sum + (e.debit ?? 0), 0);
    const totalCredit = data.lines.reduce((sum, e) => sum + (e.credit ?? 0), 0);

    console.log("Total Debit:", totalDebit, "Total Credit:", totalCredit);

    if (totalDebit !== totalCredit) {
      return {
        success: false,
        error: "El asiento contable no está balanceado",
      };
    }

    for (const entry of data.lines) {
      if (!entry.accountId) {
        return {
          success: false,
          error: "Todas las líneas deben tener una cuenta contable",
        };
      }
      if ((entry.debit ?? 0) === 0 && (entry.credit ?? 0) === 0) {
        console.log("Invalid line found:", entry);
        return {
          success: false,
          error: "Cada línea debe tener un valor en Débito o Crédito",
        };
      }
    }

    // ---------------- CREACIÓN ----------------
    const newJournal = await tx.journalEntry.create({
      data: {
        tenantId,
        date: data.date,
        description: data.description,
        type: data.type as $Enums.EntryType,
        sourceType: data.sourceType as $Enums.JournalSourceType,
        sourceId: data.sourceId,
      },
    });

    console.log("Created journal entry:", newJournal);

    await tx.journalEntryLine.createMany({
      data: data.lines.map((e) => ({
        tenantId,
        journalEntryId: newJournal.id,
        accountId: e.accountId,
        debit: e.debit,
        credit: e.credit,
        costCenterId: e.costCenterId || null,
        personId: e.personId || null,
      })),
    });

    const result = await tx.journalEntry.findUniqueOrThrow({
      where: { id: newJournal.id },
      include: { lines: true },
    });

    return {
      success: true,
      data: {
        ...result,
        description: result.description || undefined,
        sourceType: result.sourceType || undefined,
        sourceId: result.sourceId || undefined,
        lines: result.lines.map((line) => ({
          ...line,
          debit: line.debit.toNumber(),
          credit: line.credit.toNumber(),
        })),
      },
    };
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return { success: false, error: "Error creating journal entry" };
  }
};

export const updateJournalEntryTx = async (
  tx: Prisma.TransactionClient,
  id: string,
  data: Partial<
    Omit<JournalEntry, "id" | "tenantId" | "createdAt" | "updatedAt">
  >
): Promise<{ success: boolean; data?: JournalEntry; error?: string }> => {
  try {
    const { lines, ...journalData } = data;

    // ---------------------------------------
    // VALIDAR ENTRADAS (si se envían)
    // ---------------------------------------
    if (lines && lines.length > 0) {
      const totalDebit = lines.reduce((sum, e) => sum + (e.debit ?? 0), 0);
      const totalCredit = lines.reduce((sum, e) => sum + (e.credit ?? 0), 0);

      if (totalDebit !== totalCredit) {
        return {
          success: false,
          error: "El asiento contable no está balanceado",
        };
      }

      for (const entry of lines) {
        if (!entry.accountId) {
          return {
            success: false,
            error: "Cada línea debe tener una cuenta contable",
          };
        }
        if ((entry.debit ?? 0) === 0 && (entry.credit ?? 0) === 0) {
          return {
            success: false,
            error: "Cada línea debe tener un valor en Débito o Crédito",
          };
        }
      }
    }

    // ---------------------------------------
    // TRANSACCIÓN: actualizar asiento + líneas
    // ---------------------------------------

    // 1. Actualizar journal entry
    const updated = await tx.journalEntry.update({
      where: { id },
      data: {
        ...journalData,
        type: journalData.type as $Enums.EntryType | undefined,
      },
    });

    if (!updated) {
      throw new Error("Journal entry not found");
    }

    // 2. Si vienen nuevas entradas → eliminar y recrear
    if (lines) {
      await tx.journalEntryLine.deleteMany({
        where: { journalEntryId: id },
      });

      await tx.journalEntryLine.createMany({
        data: lines.map((e) => ({
          journalEntryId: id,
          tenantId: updated.tenantId,
          accountId: e.accountId,
          debit: e.debit,
          credit: e.credit,
          costCenterId: e.costCenterId || null,
          personId: e.personId || null,
        })),
      });
    }

    // 3. Retornar el asiento actualizado
    const result = await tx.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!result) {
      return {
        success: false,
        error: "Error al actualizar el asiento contable",
      };
    }

    // ---------------------------------------
    // FORMATEO (alineado con Zod)
    // ---------------------------------------

    const formatted: JournalEntry = {
      ...result,
      description: result.description || undefined,
      sourceType: result.sourceType || undefined,
      sourceId: result.sourceId || undefined,
      lines: result.lines.map((e) => ({
        ...e,
        debit: typeof e.debit === "object" ? e.debit.toNumber() : e.debit,
        credit: typeof e.credit === "object" ? e.credit.toNumber() : e.credit,
        createdAt: e.createdAt,
      })),
    };

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return { success: false, error: "Error updating journal entry" };
  }
};

export const updateJournalEntry = async (
  id: string,
  data: Partial<
    Omit<JournalEntry, "id" | "tenantId" | "createdAt" | "updatedAt">
  >
): Promise<{ success: boolean; data?: JournalEntry; error?: string }> => {
  try {
    const result = await prisma.$transaction((tx) =>
      updateJournalEntryTx(tx, id, data)
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

export const getJournalEntriesByDocument = async (
  tx: Prisma.TransactionClient,
  documentId: string
): Promise<{ success: boolean; error?: string; data?: CreateJournalEntry }> => {
  const document = await tx.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return { success: false, error: "Documento no encontrado" };
  }

  switch (document.documentType) {
    case "INVOICE":
      return getJournalEntriesInvoice(tx, documentId);

    case "WITHHOLDING":
      return getJournalEntriesWithholding(tx, documentId);

    // futuros:
    // case "CREDIT_NOTE":
    // case "DEBIT_NOTE":

    default:
      return {
        success: false,
        error: `No existe lógica contable para el tipo de documento: ${document.documentType}`,
      };
  }
};

export const getJournalEntriesInvoice = async (
  tx: Prisma.TransactionClient,
  documentId: string
): Promise<{ success: boolean; error?: string; data?: CreateJournalEntry }> => {
  const document = await tx.document.findUnique({
    where: { id: documentId },
    include: { items: true },
  });

  if (!document) {
    return {
      success: false,
      error: "Documento no encontrado",
    };
  }

  // Obtener la persona asociada al documento
  const person = await tx.person.findUnique({
    where: { id: document.personId },
  });

  if (!person) {
    return {
      success: false,
      error: "Persona no encontrada para el documento",
    };
  }

  if (
    document.entityType !== "CUSTOMER" &&
    document.entityType !== "SUPPLIER"
  ) {
    return {
      success: false,
      error: "Tipo de entidad no soportada para asiento contable",
    };
  }

  // Valida si es cliente que tenga cuenta por cobrar o proveedor que tenga cuenta por pagar
  if (document.entityType === "CUSTOMER" && !person.accountReceivableId) {
    return {
      success: false,
      error:
        "La persona asociada al documento no tiene cuenta por cobrar definida",
    };
  }

  if (document.entityType === "SUPPLIER" && !person.accountPayableId) {
    throw new Error(
      "La persona asociada al documento no tiene cuenta por pagar definida"
    );
  }

  // Construir el asiento contable
  const journalData: CreateJournalEntry = {
    date: document.issueDate,
    description: document.description || "-",
    type: document.entityType === "CUSTOMER" ? "SALE" : "PURCHASE",
    sourceType: "DOCUMENT",
    sourceId: document.id,
    lines: [
      // Ejemplo:
      // Debe: CxC
      // Haber: Ingresos por ventas (agrupar por cuenta de ingresos si es necesario)
      // Haber: IVA por pagar (si aplica)
    ],
  };

  if (document.entityType === "CUSTOMER") {
    // Venta → CxC al DEBE
    journalData.lines.push({
      accountId: person.accountReceivableId!,
      debit: document.total,
      credit: 0,
      personId: document.personId,
    });
  } else {
    // Compra → CxP al HABER
    journalData.lines.push({
      accountId: person.accountPayableId!,
      debit: 0,
      credit: document.total,
      personId: document.personId,
    });
  }

  if (!document.items || document.items.length === 0) {
    return {
      success: false,
      error: "El documento no tiene ítems para generar el asiento contable",
    };
  }

  // Haber/Debe: Ingresos por ventas (agrupar por cuenta de ingresos si es necesario)
  // Haber: Ingresos por ventas (agrupar por cuenta de ingresos si es necesario)
  const productIds = document.items.map((i) => i.productId);

  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, salesAccountId: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p.salesAccountId]));

  const salesMap = new Map<string, number>();

  for (const item of document.items) {
    const accountId = productMap.get(item.productId);

    if (!accountId) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      return {
        success: false,
        error: `Cuenta de venta no definida para el producto: ${product?.code} - ${product?.description}`,
      };
    }

    const prev = salesMap.get(accountId) ?? 0;
    salesMap.set(accountId, prev + item.subtotal);
  }

  for (const [accountId, total] of salesMap.entries()) {
    if (document.entityType === "CUSTOMER") {
      // Venta → ingresos al HABER
      journalData.lines.push({
        accountId,
        debit: 0,
        credit: total,
      });
    } else {
      // Compra → gasto/inventario al DEBE
      journalData.lines.push({
        accountId,
        debit: total,
        credit: 0,
      });
    }
  }

  // Haber: IVA por pagar
  if (document.taxTotal && document.taxTotal > 0) {
    const settings = await tx.accountingSetting.findMany({
      where: { tenantId: document.tenantId },
    });

    const VAT_SALES_SETTING = settings.find((s) => s.key === "VAT_SALES");
    const VAT_PURCHASES_SETTING = settings.find(
      (s) => s.key === "VAT_PURCHASES"
    );
    
    if (document.entityType === "CUSTOMER" && !VAT_SALES_SETTING?.accountId) {
      return {
        success: false,
        error:
          "No se ha configurado la cuenta para IVA sobre ventas en la configuración contable",
      };
    }

    if (
      document.entityType === "SUPPLIER" &&
      !VAT_PURCHASES_SETTING?.accountId
    ) {
      return {
        success: false,
        error:
          "No se ha configurado la cuenta para IVA sobre compras en la configuración contable",
      };
    }

    if (document.entityType === "CUSTOMER") {
      // Venta → IVA por pagar al HABER
      journalData.lines.push({
        accountId: VAT_SALES_SETTING!.accountId!,
        debit: 0,
        credit: document.taxTotal,
      });
    } else {
      // Compra → IVA crédito al DEBE
      journalData.lines.push({
        accountId: VAT_PURCHASES_SETTING!.accountId!,
        debit: document.taxTotal,
        credit: 0,
      });
    }
  }

  return { success: true, data: journalData };
};

export const getJournalEntriesWithholding = async (
  tx: Prisma.TransactionClient,
  documentId: string
): Promise<{ success: boolean; error?: string; data?: CreateJournalEntry }> => {
  const withholding = await tx.withholding.findFirst({
    where: { documentId },
    include: {
      document: true,
      details: true,
    },
  });

  if (!withholding) {
    return {
      success: false,
      error: "No existe una retención asociada a este documento",
    };
  }

  const { document: doc, details } = withholding;

  if (!details || details.length === 0) {
    return {
      success: false,
      error: "La retención no tiene detalles registrados",
    };
  }

  // ✅ Validar cuentas contables en cada detalle
  const invalidDetail = details.find((d) => !d.accountId);
  if (invalidDetail) {
    return {
      success: false,
      error:
        "Todos los detalles de la retención deben tener una cuenta contable definida",
    };
  }

  const person = await tx.person.findUnique({
    where: { id: doc.personId },
  });

  if (!person) {
    return {
      success: false,
      error: "Persona no encontrada para el documento de retención",
    };
  }

  // ✅ Validar CxC / CxP según tipo
  let counterAccountId: string | null = null;

  if (doc.entityType === "CUSTOMER") {
    counterAccountId = person.accountReceivableId ?? null;
    if (!counterAccountId) {
      return {
        success: false,
        error:
          "La persona asociada al documento no tiene cuenta por cobrar definida",
      };
    }
  }

  if (doc.entityType === "SUPPLIER") {
    counterAccountId = person.accountPayableId ?? null;
    if (!counterAccountId) {
      return {
        success: false,
        error:
          "La persona asociada al documento no tiene cuenta por pagar definida",
      };
    }
  }

  if (!counterAccountId) {
    return {
      success: false,
      error: "Tipo de entidad no soportado para retenciones",
    };
  }

  // ✅ Total retenido desde detalles
  const totalWithheld = details.reduce((sum, d) => sum + d.withheldAmount, 0);

  if (totalWithheld <= 0) {
    return {
      success: false,
      error: "El total retenido debe ser mayor a cero",
    };
  }

  const journalData: CreateJournalEntry = {
    date: doc.issueDate,
    description: `Retención ${doc.number ?? ""}`.trim(),
    type: doc.entityType === "CUSTOMER" ? "SALE" : "PURCHASE",
    sourceType: "DOCUMENT",
    sourceId: doc.id,
    lines: [],
  };

  // 🧾 Debe: CxC o CxP (disminuye lo que me deben / debo)
  journalData.lines.push({
    accountId: counterAccountId,
    debit: totalWithheld,
    credit: 0,
    personId: doc.personId,
  });

  // 🧾 Haber: cuentas de retención
  for (const detail of details) {
    journalData.lines.push({
      accountId: detail.accountId!,
      debit: 0,
      credit: detail.withheldAmount,
    });
  }

  // ✅ Validar que el asiento cuadre
  const debit = journalData.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const credit = journalData.lines.reduce((s, l) => s + (l.credit || 0), 0);

  if (Math.abs(debit - credit) > 0.01) {
    return {
      success: false,
      error: `El asiento de retención no cuadra. Debe: ${debit}, Haber: ${credit}`,
    };
  }

  return { success: true, data: journalData };
};
