"use server";
import { prisma } from "@/lib/prisma";
import {
  Withholding,
  WithholdingCreate,
} from "@/lib/validations/withholding/withholding";

export const createWithholding = async (
  tenantId: string,
  documentId: string,
  data: WithholdingCreate
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // valida que los campos obligatorios estén presentes, documentId es el ID del documento relacionado
    if (!documentId) {
      return { success: false, error: "El ID del documento es obligatorio" };
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

    const result = await prisma.$transaction(async (tx) => {
      // Obtener el documento relacionado para validar existencia y obtener datos necesarios
      const baseDocument = await tx.document.findUnique({
        where: { id: documentId, tenantId },
      });

      if (!baseDocument) {
        return { success: false, error: "Documento base no encontrado" };
      }

      // Calcula el balance restando el monto pagado del total del documento base
      const balance =
        baseDocument.total - (baseDocument.paidAmount || 0) - totalWithheld;

      // Actualiza el campo totalWithheld en el documento
      await tx.document.update({
        where: { id: documentId },
        data: {
          totalWithheld: totalWithheld,
          balance: balance,
        },
      });

      // Verificar que el documento relacionado exista
      const relatedDocument = await tx.document.findUnique({
        where: { id: documentId, tenantId },
      });

      if (!relatedDocument) {
        return { success: false, error: "Documento no encontrado" };
      }

      // registra el documento de retención
      const newDocument = await tx.document.create({
        data: {
          tenantId,
          entityType: relatedDocument.entityType,
          documentType: "WITHHOLDING", // Tipo de documento de retención
          issueDate: data.issueDate,
          status: "DRAFT", // Estado inicial
          personId: relatedDocument.personId,
          number: data.document.number,
          authorizationNumber: data.document.authorizationNumber ?? null,
          authorizedAt: data.document.authorizedAt
            ? new Date(data.document.authorizedAt)
            : null,
          subtotal: 0,
          taxTotal: 0,
          discount: 0,
          total: totalWithheld,
          paidAmount: totalWithheld,
          balance: 0,
          relatedDocumentId: relatedDocument.id, // Vincula la retencion con el documento original
        },
      });

      // Cabecera de retención
      const withholding = await tx.withholding.create({
        data: {
          tenantId,
          issueDate: data.issueDate,
          documentId: newDocument.id,
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

      return withholding;
    });

    return { success: true, data: result };
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
  documentId: string,
  data: WithholdingCreate
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1️⃣ Obtener la retención actual
      const existing = await tx.withholding.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("Retención no encontrada");
      }

      // 2️⃣ Validar documento base (factura)
      const baseDocument = await tx.document.findUnique({
        where: { id: documentId },
      });

      if (!baseDocument) {
        throw new Error("Documento base no encontrado");
      }

      if (!data.document) {
        throw new Error("Datos del documento de retención son obligatorios");
      }

      // 3️⃣ Recalcular total retenido
      const totalWithheld = data.details.reduce(
        (sum, d) => sum + Number(d.withheldAmount || 0),
        0
      );

      // Calcula el balance restando el monto pagado del total del documento base
      const balance =
        baseDocument.total - (baseDocument.paidAmount || 0) - totalWithheld;

      // Actualiza el campo totalWithheld en el documento
      await tx.document.update({
        where: { id: baseDocument.id },
        data: {
          totalWithheld: totalWithheld,
          balance: balance,
        },
      });

      // 4️⃣ Actualizar documento de la retención (NO la factura)
      const updatedDocument = await tx.document.update({
        where: { id: existing.documentId },
        data: {
          issueDate: data.issueDate,
          number: data.document.number ?? null,
          authorizationNumber: data.document.authorizationNumber ?? null,
          authorizedAt: data.document.authorizedAt
            ? new Date(data.document.authorizedAt)
            : null,
          total: totalWithheld,
          paidAmount: totalWithheld,
          balance: 0,
          relatedDocumentId: baseDocument.id, // 👉 vínculo a la factura
        },
      });

      // 5️⃣ Actualizar cabecera de retención
      const updatedWithholding = await tx.withholding.update({
        where: { id },
        data: {
          issueDate: data.issueDate,
          totalWithheld,
          documentId: updatedDocument.id,
        },
      });

      // 6️⃣ Reemplazar detalles
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
    });
  } catch (error: any) {
    console.error("updateWithholding error:", error);
    return {
      success: false,
      error: error.message || "Error actualizando la retención",
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
        document: true,
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
