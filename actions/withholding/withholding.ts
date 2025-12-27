"use server";
import { prisma } from "@/lib/prisma";
import {
  Withholding,
  WithholdingCreate,
} from "@/lib/validations/withholding/withholding";
import { Prisma } from "@/prisma/generated/prisma";

export const createWithholding = async (
  tenantId: string,
  documentId: string,
  data: WithholdingCreate
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const withhelding = await createWithholdingTx(
        tx,
        tenantId,
        documentId,
        data
      );

      return withhelding;
    });

    // valida que los campos obligatorios estén presentes, documentId es el ID del documento relacionado
    if (!result.success) {
      return {
        success: false,
        error: result.error || "El ID del documento es obligatorio",
      };
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error("createWithholding error:", error);
    return {
      success: false,
      error: "Error al crear la retención",
    };
  }
};

export const createWithholdingTx = async (
  tx: Prisma.TransactionClient,
  tenantId: string,
  documentId: string,
  data: WithholdingCreate
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // valida que los campos obligatorios estén presentes, documentId es el ID del documento relacionado
    if (!documentId) {
      return { success: false, error: "El ID del documento es obligatorio" };
    }

    if (!data) {
      return {
        success: false,
        error: "Los datos de la retención son obligatorios",
      };
    }

    // la retención debe tener al menos un detalle
    if (!data.details?.length) {
      return { success: false, error: "La retención debe tener detalles" };
    }

    // recalcular total desde backend
    const totalWithheld = data.details.reduce(
      (sum, d) => sum + Number(d.withheldAmount || 0),
      0
    );

    // Cabecera de retención
    const withholding = await tx.withholding.create({
      data: {
        tenantId,
        issueDate: data.issueDate,
        documentId: documentId,
        totalWithheld,
      },
    });

    // Detalles (bulk)
    await tx.withholdingDetail.createMany({
      data: data.details.map((detail) => ({
        tenantId,
        withholdingId: withholding.id,
        codeId: detail.codeId,
        type: detail.type,
        baseAmount: detail.baseAmount,
        percentage: detail.percentage,
        withheldAmount: detail.withheldAmount,
        accountId: detail.accountId,
      })),
    });

    // actualiza el total en documento de retencion
    await tx.document.update({
      where: { id: documentId },
      data: {
        total: totalWithheld,
        paidAmount: totalWithheld,
        balance: 0,
      },
    });

    return { success: true, data: withholding };
  } catch (error: any) {
    console.error("createWithholding error:", error);
    return {
      success: false,
      error: "Error al crear la retención",
    };
  }
};

export const updateWithholding = async (
  id: string,
  data: Partial<Withholding>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const updatedWithholding = await updateWithholdingTx(tx, id, data);

      return { success: true, data: updatedWithholding };
    });
  } catch (error: any) {
    console.error("updateWithholding error:", error);
    return {
      success: false,
      error: error.message || "Error actualizando la retención",
    };
  }
};

export const updateWithholdingTx = async (
  tx: Prisma.TransactionClient,
  id: string,
  data: Partial<Withholding>
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Obtener la retención existente
    const existing = await tx.withholding.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Retención no encontrada");
    }

    // Obtener el documento base relacionado
    const baseDocument = await tx.document.findUnique({
      where: { id: existing.documentId },
    });

    if (!baseDocument) {
      throw new Error("Documento base no encontrado");
    }

    if (!data.details || data.details.length === 0) {
      return { success: false, error: "La retención debe tener detalles" };
    }

    // Recalcular total retenido
    const totalWithheld = data.details.reduce(
      (sum, d) => sum + Number(d.withheldAmount || 0),
      0
    );

    // Actualiza el campo totalWithheld en el documento
    await tx.document.update({
      where: { id: baseDocument.id },
      data: {
        total: totalWithheld,
        totalWithheld: totalWithheld,
        balance: 0,
      },
    });

    // Si el documento base tiene un documento relacionado, actualizarlo también
    if (baseDocument.relatedDocumentId) {
      const relatedDocument = await tx.document.findUnique({
        where: { id: baseDocument.relatedDocumentId || "" },
      });

      if (relatedDocument) {
        const balance =
          relatedDocument.total -
          (relatedDocument.paidAmount || 0) -
          totalWithheld;

        await tx.document.update({
          where: { id: relatedDocument.id },
          data: {
            totalWithheld: totalWithheld,
            balance: balance,
          },
        });
      }
    }

    // Actualizar cabecera de retención
    const updatedWithholding = await tx.withholding.update({
      where: { id },
      data: {
        issueDate: data.issueDate,
        totalWithheld,
        documentId: baseDocument.id,
      },
    });

    // Reemplazar detalles
    await tx.withholdingDetail.deleteMany({
      where: { withholdingId: id },
    });

    if (data.details.length > 0) {
      await tx.withholdingDetail.createMany({
        data: data.details.map((detail) => ({
          tenantId: updatedWithholding.tenantId,
          withholdingId: updatedWithholding.id,
          codeId: detail.codeId,
          type: detail.type,
          baseAmount: detail.baseAmount,
          percentage: detail.percentage,
          withheldAmount: detail.withheldAmount,
          accountId: detail.accountId,
        })),
      });
    }

    return { success: true, data: updatedWithholding };
  } catch (error: any) {
    console.error("createWithholding error:", error);
    return {
      success: false,
      error: "Error al crear la retención",
    };
  }
};

export const getWithholding = async (
  id: string
): Promise<{ success: boolean; data?: Withholding; error?: string }> => {
  try {
    const withholding = await prisma.withholding.findUnique({
      where: { id },
      include: {
        document: {
          include: {
            documentFiscalInfo: true,
          },
        },
        details: true,
      },
    });

    if (!withholding) {
      return { success: false, error: "Withholding not found" };
    }

    const withholdingMapped: Withholding = {
      ...withholding,
      issueDate: new Date(withholding.issueDate),
      createdAt: new Date(withholding.createdAt),
      document: {
        ...withholding.document,
        issueDate: new Date(withholding.document.issueDate),
        number: withholding.document.number || "",
        authorizedAt: withholding.document.authorizedAt
          ? new Date(withholding.document.authorizedAt)
          : null,
        fiscalInfo: withholding.document.documentFiscalInfo
          ? {
              ...withholding.document.documentFiscalInfo,
            }
          : undefined,
      },
      details: withholding.details.map((detail) => ({
        ...detail,
      })),
    };

    return { success: true, data: withholdingMapped };
  } catch (error) {
    return { success: false, error: "Error retrieving withholding" };
  }
};

export const getWithholdingByBaseDocument = async (
  baseDocumentId: string
): Promise<{ success: boolean; data?: Withholding; error?: string }> => {
  try {
    const withholding = await prisma.withholding.findFirst({
      where: {
        document: {
          relatedDocumentId: baseDocumentId,
          documentType: "WITHHOLDING",
        },
      },
      include: {
        document: {
          include: {
            documentFiscalInfo: true,
          },
        },
        details: true,
      },
    });

    if (!withholding) {
      return { success: false, error: "retención no encontrada" };
    }

    const withholdingMapped: Withholding = {
      ...withholding,
      issueDate: new Date(withholding.issueDate),
      createdAt: new Date(withholding.createdAt),
      document: {
        ...withholding.document,
        issueDate: new Date(withholding.document.issueDate),
        number: withholding.document.number || "",
        authorizedAt: withholding.document.authorizedAt
          ? new Date(withholding.document.authorizedAt)
          : null,
        fiscalInfo: withholding.document.documentFiscalInfo
          ? {
              ...withholding.document.documentFiscalInfo,
            }
          : undefined,
      },
      details: withholding.details.map((detail) => ({
        ...detail,
      })),
    };

    return { success: true, data: withholdingMapped };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al consultar la retención",
    };
  }
};

export const getWithholdingByDocumentId = async (
  documentId: string
): Promise<{ success: boolean; data?: Withholding; error?: string }> => {
  try {
    const withholding = await prisma.withholding.findFirst({
      where: {
        documentId,
      },
      include: {
        document: true,
        details: true,
      },
    });

    if (!withholding) {
      return { success: false, error: "retención no encontrada" };
    }

    const withholdingMapped: Withholding = {
      ...withholding,
      issueDate: new Date(withholding.issueDate),
      createdAt: new Date(withholding.createdAt),
      document: {
        ...withholding.document,
        issueDate: new Date(withholding.document.issueDate),
        number: withholding.document.number || "",
        authorizedAt: withholding.document.authorizedAt
          ? new Date(withholding.document.authorizedAt)
          : null,
      },
      details: withholding.details.map((detail) => ({
        ...detail,
      })),
    };

    return { success: true, data: withholdingMapped };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al consultar la retención",
    };
  }
};

export const deleteWithholding = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Obtener la retención con su documento
      const withholding = await tx.withholding.findUnique({
        where: { id },
        include: { document: true },
      });

      if (!withholding) {
        throw new Error("Retención no encontrada");
      }

      const withholdingDocumentId = withholding.documentId;
      const baseDocumentId = withholding.document.relatedDocumentId;

      // 2️⃣ Eliminar detalles
      await tx.withholdingDetail.deleteMany({
        where: { withholdingId: id },
      });

      // 3️⃣ Eliminar la cabecera de retención
      await tx.withholding.delete({
        where: { id },
      });

      // 4️⃣ Eliminar el documento de retención (AHORA sí se puede)
      await tx.document.delete({
        where: { id: withholdingDocumentId },
      });

      // 5️⃣ (Opcional) Actualizar documento base si necesitas reflejar algo
      if (baseDocumentId) {
        const baseDocument = await tx.document.findUnique({
          where: { id: baseDocumentId },
        });

        if (baseDocument) {
          const newBalance =
            baseDocument.total - (baseDocument.paidAmount || 0);

          await tx.document.update({
            where: { id: baseDocument.id },
            data: {
              totalWithheld: 0,
              balance: newBalance,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("deleteWithholding error:", error);
    return {
      success: false,
      error: error.message || "Error eliminando la retención",
    };
  }
};
