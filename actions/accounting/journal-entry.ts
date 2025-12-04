"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateJournalEntry,
  JournalEntry,
  JournalEntrySchema,
} from "@/lib/validations/accounting/journal_entry";

export const getJournalEntries = async (
  tenantId: string,
  search?: string
): Promise<{ success: boolean; data?: JournalEntry[]; error?: string }> => {
  try {
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        ...(search
          ? {
              OR: [
                { description: { contains: search, mode: "insensitive" } },
                { documentId: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        lines: true,
      },
      orderBy: { date: "desc" },
    });

    const formatted: JournalEntry[] = journalEntries.map((je) => ({
      ...je,
      description: je.description || undefined,
      documentType: je.documentType || undefined,
      documentId: je.documentId || undefined,
      createdAt: je.createdAt,
      updatedAt: je.updatedAt,
      lines: je.lines.map((e) => ({
        ...e,
        debit: typeof e.debit === "object" ? e.debit.toNumber() : e.debit,
        credit: typeof e.credit === "object" ? e.credit.toNumber() : e.credit,
        createdAt: e.createdAt,
      })),
    }));

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Error fetching journal lines:", error);
    return { success: false, error: "Error fetching journal lines" };
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
      documentType: journalEntry.documentType || undefined,
      documentId: journalEntry.documentId || undefined,
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
    // Aqui se debe validar si el asiento puede ser eliminado (no estar referenciado en otros documentos)

    const result = await prisma.$transaction(async (tx) => {
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
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return { success: false, error: "Error deleting journal entry" };
  }
};

export const createJournalEntry = async (
  tenantId: string,
  data: CreateJournalEntry
): Promise<{ success: boolean; data?: JournalEntry; error?: string }> => {
  try {
    // ------------------------------
    // VALIDACIONES
    // ------------------------------

    if (!data.lines || data.lines.length === 0) {
      return {
        success: false,
        error: "El asiento debe tener al menos un detalle",
      };
    }

    const totalDebit = data.lines.reduce((sum, e) => sum + (e.debit ?? 0), 0);
    const totalCredit = data.lines.reduce((sum, e) => sum + (e.credit ?? 0), 0);

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
        return {
          success: false,
          error: "Cada línea debe tener un valor en Débito o Crédito",
        };
      }
    }

    // ------------------------------
    // TRANSACCIÓN
    // ------------------------------

    const result = await prisma.$transaction(async (tx) => {
      const newJournal = await tx.journalEntry.create({
        data: {
          tenantId,
          date: data.date,
          description: data.description,
          type: data.type,
          documentType: data.documentType,
          documentId: data.documentId,
        },
      });

      // crear ledger lines
      const ledgerEntriesData = data.lines.map((e) => ({
        tenantId,
        journalEntryId: newJournal.id,
        accountId: e.accountId,
        debit: e.debit,
        credit: e.credit,
        costCenterId: e.costCenterId || null,
        personId: e.personId || null,
      }));

      await tx.journalEntryLine.createMany({
        data: ledgerEntriesData,
      });

      // retornar el asiento completo
      return tx.journalEntry.findUnique({
        where: { id: newJournal.id },
        include: {
          lines: true,
        },
      });
    });

    // ------------------------------
    // VALIDACIÓN POST-TRANSACCIÓN
    // ------------------------------

    if (!result) {
      return {
        success: false,
        error: "Error al crear el asiento contable",
      };
    }

    // Adaptar al schema final si fuera necesario
    const formatted: JournalEntry = {
      ...result,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      description: result.description || undefined,
      documentType: result.documentType || undefined,
      documentId: result.documentId || undefined,
      lines: result.lines.map((e) => ({
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
    console.error("Error creating journal entry:", error);
    return { success: false, error: "Error creating journal entry" };
  }
};

export const updateJournalEntry = async (
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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar journal entry
      const updated = await tx.journalEntry.update({
        where: { id },
        data: journalData,
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
      return tx.journalEntry.findUnique({
        where: { id },
        include: { lines: true },
      });
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
      documentType: result.documentType || undefined,
      documentId: result.documentId || undefined,
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
