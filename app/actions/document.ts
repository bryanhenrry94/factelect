"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateDocument,
  DocumentItem,
  DocumentResponse,
} from "@/lib/validations";

export const getDocuments = async (
  tenantId: string
): Promise<{ success: boolean; data?: DocumentResponse[]; error?: string }> => {
  try {
    const documents = await prisma.document.findMany({
      where: { tenantId },
      include: {
        person: true,
      },
    });

    const formattedDocuments: DocumentResponse[] = documents.map(
      (document) => ({
        ...document,
        status: document.status as "DRAFT" | "CONFIRMED" | "CANCELED",
        personId: document.personId,
        description: document.description || undefined,
        person: document.person
          ? {
              id: document.person.id,
              firstName: document.person.firstName,
              lastName: document.person.lastName,
              identification: document.person.identification || undefined,
            }
          : undefined,
        issueDate: document.issueDate,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      })
    );

    return { success: true, data: formattedDocuments };
  } catch (error) {
    console.error("Error fetching sales:", error);
    return { success: false, error: "Error fetching sales" };
  }
};

export const deleteDocument = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.document.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return { success: false, error: "Error deleting invoice" };
  }
};

export const createDocument = async (
  data: CreateDocument,
  tenantId: string
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const balance = data.total - (data.paidAmount || 0);

    const newDocument = await prisma.document.create({
      data: {
        tenantId,
        entityType: data.entityType,
        documentType: data.documentType,
        personId: data.personId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        status: data.status,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discount: data.discount,
        total: data.total,
        paidAmount: data.paidAmount,
        balance: balance,
        description: data.description,
      },
    });

    if (data.items && data.items.length > 0) {
      const documentItemsData = data.items.map((item) => ({
        ...item,
        documentId: newDocument.id,
      }));

      await prisma.documentItem.createMany({
        data: documentItemsData,
      });
    }

    const formattedDocuments: DocumentResponse = {
      ...newDocument,
      status: newDocument.status as "DRAFT" | "CONFIRMED" | "CANCELED",
      personId: newDocument.personId,
      description: newDocument.description || undefined,
      issueDate: newDocument.issueDate,
      createdAt: newDocument.createdAt,
      updatedAt: newDocument.updatedAt,
    };

    // Guarda document fiscal info si es necesario
    const fiscalInfo = data.fiscalInfo;
    if (fiscalInfo) {
      await prisma.documentFiscalInfo.create({
        data: {
          documentId: newDocument.id,
          establishmentId: fiscalInfo.establishmentId,
          emissionPointId: fiscalInfo.emissionPointId,
          sequence: fiscalInfo.sequence,
          environment: fiscalInfo.environment,
          sriStatus: fiscalInfo.sriStatus,
        },
      });

      // Actualiza secuencias en el punto de emisión
      await prisma.emissionPoint.update({
        where: { id: fiscalInfo.emissionPointId },
        data: {
          currentInvoiceSequence: {
            increment: 1,
          },
        },
      });
    }

    return { success: true, data: formattedDocuments };
  } catch (error) {
    console.error("Error creating document:", error);
    return { success: false, error: "Error creating document" };
  }
};

export const updateDocument = async (
  id: string,
  data: Partial<CreateDocument>
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        personId: data.personId,
        issueDate: data.issueDate,
        status: data.status,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discount: data.discount,
        total: data.total,
        paidAmount: data.paidAmount,
        balance: data.balance,
        description: data.description,
      },
      include: {
        person: true,
      },
    });

    // eliminar y volver a crear los items de la venta podria ser una opcion dependiendo del caso de uso
    await prisma.documentItem.deleteMany({
      where: { documentId: id },
    });

    if (data.items && data.items.length > 0) {
      const documentItemsData = data.items.map((item) => ({
        ...item,
        documentId: id,
      }));

      await prisma.documentItem.createMany({
        data: documentItemsData,
      });
    }

    const formattedDocument: DocumentResponse = {
      ...updatedDocument,
      status: updatedDocument.status as "DRAFT" | "CONFIRMED" | "CANCELED",
      personId: updatedDocument.personId,
      description: updatedDocument.description || undefined,
      person: updatedDocument.person
        ? {
            id: updatedDocument.person.id,
            firstName: updatedDocument.person.firstName,
            lastName: updatedDocument.person.lastName,
            identification: updatedDocument.person.identification || undefined,
          }
        : undefined,
      issueDate: updatedDocument.issueDate,
      createdAt: updatedDocument.createdAt,
      updatedAt: updatedDocument.updatedAt,
    };

    return { success: true, data: formattedDocument };
  } catch (error) {
    console.error("Error updating document:", error);
    return { success: false, error: "Error updating document" };
  }
};

export const getDocumentItems = async (
  documentId: string
): Promise<{
  success: boolean;
  data?: DocumentItem[];
  error?: string;
}> => {
  try {
    const items = await prisma.documentItem.findMany({
      where: { documentId },
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Error fetching document items:", error);
    return { success: false, error: "Error fetching document items" };
  }
};

export const getDocument = async (
  id: string
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        person: true,
      },
    });

    if (!document) {
      return { success: false, error: "Documento no encontrado" };
    }

    const formattedDocument: DocumentResponse = {
      ...document,
      status: document.status as "DRAFT" | "CONFIRMED" | "CANCELED",
      personId: document.personId,
      description: document.description || undefined,
      person: document.person
        ? {
            id: document.person.id,
            firstName: document.person.firstName,
            lastName: document.person.lastName,
            identification: document.person.identification || undefined,
          }
        : undefined,
      issueDate: document.issueDate,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };

    return { success: true, data: formattedDocument };
  } catch (error) {
    console.error("Error fetching document:", error);
    return { success: false, error: "Error fetching document" };
  }
};
