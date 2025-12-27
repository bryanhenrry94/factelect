"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateDocument,
  CreateDocumentTax,
  DocumentItem,
  DocumentResponse,
} from "@/lib/validations";
import { $Enums, DocumentPayment } from "@/prisma/generated/prisma";
import { formatDate } from "@/utils/formatters";

import { Prisma } from "@/prisma/generated/prisma";
import {
  createJournalEntryTx,
  getJournalEntriesByDocument,
} from "../accounting/journal-entry";
import { CreateJournalEntry } from "@/lib/validations/accounting/journal_entry";
import {
  createWithholdingTx,
  updateWithholdingTx,
} from "../withholding/withholding";

export interface DocumentFilter {
  tenantId: string;
  search?: string;
  personId?: string;
  entityType?: $Enums.EntityType;
  documentType?: $Enums.DocumentType;
  dateFrom?: Date;
  dateTo?: Date;
  withoutWithholding?: boolean;
}

export const getDocuments = async (
  params: DocumentFilter
): Promise<{
  success: boolean;
  data?: DocumentResponse[];
  error?: string;
}> => {
  try {
    const where: Prisma.DocumentWhereInput = {
      tenantId: params.tenantId,
    };

    if (params.personId) {
      where.personId = params.personId;
    }

    if (params.entityType) {
      where.entityType = params.entityType;
    }

    if (params.documentType) {
      where.documentType = params.documentType;
    }

    if (params.withoutWithholding) {
      where.totalWithheld = 0;
    }

    if (params.dateFrom || params.dateTo) {
      where.issueDate = {
        ...(params.dateFrom ? { gte: params.dateFrom } : {}),
        ...(params.dateTo ? { lte: params.dateTo } : {}),
      };
    }

    if (params.search) {
      const search = params.search.trim();

      where.OR = [
        {
          number: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          person: {
            OR: [
              {
                firstName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                businessName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                identification: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        person: true,
        documentFiscalInfo: {
          include: {
            establishment: true,
            emissionPoint: true,
          },
        },
      },
      orderBy: {
        issueDate: "desc",
      },
    });

    const formattedDocuments: DocumentResponse[] = documents.map((doc) => {
      const { person, documentFiscalInfo, number, dueDate, description } = doc;

      const fullname = person
        ? person.firstName
          ? `${person.firstName} ${person.lastName}`
          : person.businessName ?? undefined
        : undefined;

      return {
        ...doc,
        documentType: doc.documentType as $Enums.DocumentType,
        status: doc.status as "DRAFT" | "CONFIRMED" | "CANCELED",
        number: number || undefined,
        dueDate: dueDate || undefined,
        description: description || undefined,
        documentFiscalInfo: documentFiscalInfo || undefined,
        totalWithheld: doc.totalWithheld,
        person: person
          ? {
              id: person.id,
              identification: person.identification || undefined,
              fullname,
            }
          : undefined,
      };
    });

    return { success: true, data: formattedDocuments };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { success: false, error: "Error fetching documents" };
  }
};

export const deleteDocument = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.$transaction(async (tx) => {
      const document = await tx.document.findUnique({
        where: { id },
      });

      if (!document) {
        throw new Error("NOT_FOUND");
      }

      const existingFiscal = await tx.documentFiscalInfo.findUnique({
        where: { documentId: id },
      });

      if (existingFiscal) {
        await tx.documentFiscalInfo.delete({
          where: { documentId: id },
        });
      }

      // 🧾 Si es factura, validar que no tenga retenciones asociadas
      if (document.documentType === "INVOICE") {
        const associatedWithholdings = await tx.withholding.count({
          where: { documentId: id },
        });

        if (associatedWithholdings > 0) {
          throw new Error("HAS_WITHHOLDINGS");
        }
      }

      // 📄 Si es documento de retención, eliminar primero la retención
      if (document.documentType === "WITHHOLDING") {
        if (document.relatedDocumentId) {
          const baseDocument = await tx.document.findFirst({
            where: { id: document.relatedDocumentId },
          });

          if (baseDocument) {
            await tx.document.update({
              where: { id: baseDocument.id },
              data: {
                totalWithheld: 0,
                balance: baseDocument.total - (baseDocument.paidAmount || 0),
              },
            });
          }
        }

        const withholding = await tx.withholding.findFirst({
          where: { documentId: id },
        });

        if (withholding) {
          await tx.withholdingDetail.deleteMany({
            where: { withholdingId: withholding.id },
          });

          // elimina la retención (y lo que dependa de ella)
          await tx.withholding.delete({
            where: { id: withholding.id },
          });
        }
      }

      // 🗑️ Finalmente elimina el documento
      await tx.document.delete({
        where: { id },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting document:", error);

    if (error.message === "NOT_FOUND") {
      return { success: false, error: "Documento no encontrado" };
    }

    if (error.message === "HAS_WITHHOLDINGS") {
      return {
        success: false,
        error:
          "No se puede eliminar el documento porque tiene retenciones asociadas",
      };
    }

    return { success: false, error: "Error eliminando el documento" };
  }
};

export const createDocument = async (
  tenantId: string,
  data: CreateDocument
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Crear documento
      const resultDocument = await createDocumentTx(tx, tenantId, data);

      if (!resultDocument.success || !resultDocument.data) {
        throw new Error(resultDocument.error || "Error creando el documento");
      }

      return { document: resultDocument.data };
    });

    return { success: true, data: result.document };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
};

export const createDocumentTx = async (
  tx: Prisma.TransactionClient,
  tenantId: string,
  data: CreateDocument
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const resValidated = await validateDocument(data);
    if (!resValidated.success) {
      return {
        success: false,
        error: resValidated.error || "Datos del documento inválidos",
      };
    }

    const balance = data.total - (data.paidAmount || 0);

    // 1. Crear documento
    const newDocument = await tx.document.create({
      data: {
        tenantId,
        entityType: data.entityType,
        documentType: data.documentType as $Enums.DocumentType,
        number: data.number || undefined,
        authorizationNumber: data.authorizationNumber || undefined,
        authorizedAt: data.authorizedAt || undefined,
        issueDate: data.issueDate,
        dueDate: data.dueDate || undefined,
        status: data.status,
        personId: data.personId,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discount: data.discount,
        totalWithheld: data.totalWithheld || 0,
        total: data.total,
        paidAmount: data.paidAmount,
        balance,
        description: data.description || undefined,
        relatedDocumentId: data.relatedDocumentId || undefined,
      },
    });

    // 2. Si tiene info fiscal, crearla y actualizar secuencia
    if (data.fiscalInfo) {
      // Crear info fiscal
      const newFiscalInfo = await tx.documentFiscalInfo.create({
        data: {
          documentId: newDocument.id,
          establishmentId: data.fiscalInfo.establishmentId,
          emissionPointId: data.fiscalInfo.emissionPointId,
          sequence: data.fiscalInfo.sequence,
          environment: data.fiscalInfo.environment,
          sriStatus: data.fiscalInfo.sriStatus,
        },
      });

      // Actualizar secuencia en emissionPointSequence
      await tx.emissionPointSequence.update({
        where: {
          emissionPointId_documentType: {
            emissionPointId: data.fiscalInfo.emissionPointId,
            documentType: data.documentType as $Enums.DocumentType,
          },
        },
        data: {
          currentSequence: data.fiscalInfo.sequence + 1,
        },
      });

      // Actualizar número si es necesario
      const existingFiscal = await tx.documentFiscalInfo.findUnique({
        where: { id: newFiscalInfo.id },
        include: {
          establishment: true,
          emissionPoint: true,
        },
      });

      if (
        !existingFiscal?.establishment?.code ||
        !existingFiscal?.emissionPoint?.code ||
        existingFiscal.sequence == null
      ) {
        return {
          success: false,
          error: "Información fiscal incompleta para actualizar el número",
        };
      }

      const seq = Number(existingFiscal.sequence);
      if (Number.isNaN(seq)) {
        throw new Error("Secuencia fiscal inválida");
      }

      const number = `${existingFiscal.establishment.code}-${
        existingFiscal.emissionPoint.code
      }-${seq.toString().padStart(9, "0")}`;

      if (data.number !== number) {
        await tx.document.update({
          where: { id: newDocument.id },
          data: { number },
        });
      }
    }

    // 3. Registros para INVOICE
    if (data.documentType === "INVOICE") {
      if (data.items?.length) {
        await tx.documentItem.createMany({
          data: data.items.map((item) => ({
            ...item,
            documentId: newDocument.id,
          })),
          skipDuplicates: true,
        });
      }

      // registra impuestos si vienen
      if (data.taxTotal > 0 && data.items?.length) {
        // Crear impuestos agrupados si existen
        const taxMap: Record<string, CreateDocumentTax> = {};

        data.items.forEach((item) => {
          if (!item.tax || item.tax === "NO_IVA") return;

          // Mapea tu enum interno a códigos SRI
          const taxCodeMap: Record<
            string,
            { code: string; percentage_code: string }
          > = {
            IVA_0: { code: "2", percentage_code: "0" },
            IVA_5: { code: "2", percentage_code: "5" },
            IVA_12: { code: "2", percentage_code: "2" },
            IVA_14: { code: "2", percentage_code: "3" },
            IVA_15: { code: "2", percentage_code: "4" },
            EXENTO_IVA: { code: "2", percentage_code: "6" },
          };

          const sriTax = taxCodeMap[item.tax];
          if (!sriTax) return;

          const key = `${sriTax.code}-${sriTax.percentage_code}`;

          if (!taxMap[key]) {
            taxMap[key] = {
              code: sriTax.code,
              percentage_code: sriTax.percentage_code,
              base: 0,
              amount: 0,
              documentId: newDocument.id, // ya lo puedes poner aquí
            };
          }

          taxMap[key].base += Number(item.subtotal || 0);
          taxMap[key].amount += Number(item.taxAmount || 0);
        });

        const taxesToCreate = Object.values(taxMap);

        if (taxesToCreate.length) {
          await tx.documentTax.createMany({
            data: taxesToCreate,
            skipDuplicates: true,
          });
        }
      }

      // 4. Payments
      if (data.documentPayments?.length) {
        await tx.documentPayment.createMany({
          data: data.documentPayments.map((p) => ({
            ...p,
            documentId: newDocument.id,
          })),
          skipDuplicates: true,
        });
      }

      // 5. Crear asiento contable
      const resJournalData = await getJournalEntriesByDocument(
        tx,
        newDocument.id
      );

      if (!resJournalData.success || !resJournalData.data) {
        throw new Error(
          resJournalData.error ||
            "Error obteniendo datos para el asiento contable"
        );
      }

      const journalData: CreateJournalEntry | null =
        resJournalData.success && resJournalData.data
          ? resJournalData.data
          : null;

      if (!journalData) {
        throw new Error("Error obteniendo datos para el asiento contable");
      }

      // Crear asiento contable
      const restJournal = await createJournalEntryTx(tx, tenantId, journalData);
      if (!restJournal.success) {
        throw new Error(
          restJournal.error || "Error creando el asiento contable"
        );
      }
    }

    // 4. Registros para WITHHOLDING
    if (data.documentType === "WITHHOLDING" && data.withholding) {
      // crea la retención asociada al documento
      const resWithholding = await createWithholdingTx(
        tx,
        tenantId,
        newDocument.id,
        data.withholding
      );

      if (!resWithholding.success) {
        return {
          success: false,
          error: resWithholding.error || "Error creando la retención",
        };
      }

      // Calcula el balance restando el monto pagado del total del documento base
      const newWithholding = resWithholding.data!;
      const totalWithheld = newWithholding.totalWithheld || 0;

      // si tiene documento relacionado, actualiza el total retenido en el documento base
      if (data.relatedDocumentId!) {
        // obtiene el documento relacionado
        const relatedDoc = await tx.document.findUnique({
          where: { id: data.relatedDocumentId! },
        });

        if (relatedDoc) {
          const balance =
            relatedDoc.total - (relatedDoc.paidAmount || 0) - totalWithheld;

          await tx.document.update({
            where: { id: data.relatedDocumentId! },
            data: {
              totalWithheld: totalWithheld,
              balance: balance,
            },
          });
        }
      }

      // 5. Crear asiento contable
      const resJournalData = await getJournalEntriesByDocument(
        tx,
        newDocument.id
      );

      if (!resJournalData.success || !resJournalData.data) {
        throw new Error(
          resJournalData.error ||
            "Error obteniendo datos para el asiento contable"
        );
      }

      const journalData: CreateJournalEntry | null =
        resJournalData.success && resJournalData.data
          ? resJournalData.data
          : null;

      if (!journalData) {
        throw new Error("Error obteniendo datos para el asiento contable");
      }

      // Crear asiento contable
      const restJournal = await createJournalEntryTx(tx, tenantId, journalData);
      if (!restJournal.success) {
        throw new Error(
          restJournal.error || "Error creando el asiento contable"
        );
      }
    }

    // Se formatea solo al final, fuera de la transacción
    const formattedDocument: DocumentResponse = {
      ...newDocument,
      number: newDocument.number || undefined,
      dueDate: newDocument.dueDate || undefined,
      description: newDocument.description || undefined,
      documentType: newDocument.documentType as $Enums.DocumentType,
    };

    return { success: true, data: formattedDocument };
  } catch (error: any) {
    console.error("Error creating document:", error);
    return {
      success: false,
      error: error.message || "Error creando el documento",
    };
  }
};

export const updateDocument = async (
  id: string,
  data: CreateDocument
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar documento
      const resultDocument = await updateDocumentTx(tx, id, data);

      if (!resultDocument.success || !resultDocument.data) {
        throw new Error(
          resultDocument.error || "Error actualizando el documento"
        );
      }

      return { document: resultDocument.data };
    });

    return { success: true, data: result.document };
  } catch (error: any) {
    console.error("Error updating document:", error);
    return {
      success: false,
      error: error.message || "Error actualizando el documento",
    };
  }
};

export const updateDocumentTx = async (
  tx: Prisma.TransactionClient,
  id: string,
  data: CreateDocument
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const resValidated = await validateDocument(data);
    if (!resValidated.success) {
      return {
        success: false,
        error: resValidated.error || "Datos del documento inválidos",
      };
    }

    // Valida que no tenga transacciones asociadas
    const associatedTransactions = await tx.transactionDocument.count({
      where: {
        documentId: id,
      },
    });

    if (associatedTransactions > 0) {
      return {
        success: false,
        error:
          "No se puede actualizar el documento porque tiene transacciones asociadas",
      };
    }

    // recalcula saldo del documento
    const paidAmount = await tx.transactionDocument.aggregate({
      where: { documentId: id },
      _sum: { amount: true },
    });

    const document = await tx.document.findFirst({
      where: { id },
    });

    const totalPaid = paidAmount._sum.amount || 0;
    const totalWithheld = document?.totalWithheld || 0;
    const balance = data.total - totalPaid - totalWithheld;

    // 1. Actualizar documento
    const updatedDocument = await tx.document.update({
      where: {
        id,
      },
      data: {
        entityType: data.entityType,
        documentType: data.documentType as $Enums.DocumentType,
        number: data.number || undefined,
        authorizationNumber: data.authorizationNumber || undefined,
        authorizedAt: data.authorizedAt || undefined,
        issueDate: data.issueDate,
        dueDate: data.dueDate || undefined,
        status: data.status,
        personId: data.personId,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discount: data.discount,
        total: data.total,
        paidAmount: totalPaid,
        totalWithheld: data.totalWithheld || 0,
        balance: balance,
        description: data.description || undefined,
        relatedDocumentId: data.relatedDocumentId || undefined,
      },
    });

    // 3. Fiscal Info (update o create)
    if (data.fiscalInfo) {
      const existingFiscal = await tx.documentFiscalInfo.findUnique({
        where: { documentId: id },
        include: {
          establishment: true,
          emissionPoint: true,
        },
      });

      if (existingFiscal) {
        await tx.documentFiscalInfo.update({
          where: { documentId: id },
          data: {
            establishmentId: data.fiscalInfo.establishmentId,
            emissionPointId: data.fiscalInfo.emissionPointId,
            sequence: data.fiscalInfo.sequence,
            environment: data.fiscalInfo.environment,
            sriStatus: data.fiscalInfo.sriStatus,
          },
        });

        // Actualizar número si es necesario
        if (
          !existingFiscal?.establishment?.code ||
          !existingFiscal?.emissionPoint?.code ||
          existingFiscal.sequence == null
        ) {
          return {
            success: false,
            error: "Información fiscal incompleta para actualizar el número",
          };
        }

        const seq = Number(existingFiscal.sequence);
        if (Number.isNaN(seq)) {
          throw new Error("Secuencia fiscal inválida");
        }

        const number = `${existingFiscal.establishment.code}-${
          existingFiscal.emissionPoint.code
        }-${seq.toString().padStart(9, "0")}`;

        console.log("number: ", number);

        if (data.number !== number) {
          await tx.document.update({
            where: { id },
            data: { number },
          });
        }
      } else {
        await tx.documentFiscalInfo.create({
          data: {
            documentId: id,
            establishmentId: data.fiscalInfo.establishmentId,
            emissionPointId: data.fiscalInfo.emissionPointId,
            sequence: data.fiscalInfo.sequence,
            environment: data.fiscalInfo.environment,
            sriStatus: data.fiscalInfo.sriStatus,
          },
        });
      }
    } else {
      // Si ya no viene fiscalInfo, eliminarla
      await tx.documentFiscalInfo.deleteMany({
        where: { documentId: id },
      });
    }

    // Si es INVOICE
    if (data.documentType === "INVOICE") {
      // 1. Reemplazar items
      await tx.documentItem.deleteMany({
        where: { documentId: id },
      });

      if (data.items?.length) {
        await tx.documentItem.createMany({
          data: data.items.map((item) => ({
            ...item,
            documentId: id,
          })),
        });
      }

      // 2. Registrar impuestos si vienen
      if (data.taxTotal > 0 && data.items?.length) {
        await tx.documentTax.deleteMany({
          where: { documentId: id },
        });

        // Crear impuestos agrupados si existen
        const taxMap: Record<string, CreateDocumentTax> = {};

        data.items.forEach((item) => {
          if (!item.tax || item.tax === "NO_IVA") return;

          // Mapea tu enum interno a códigos SRI
          const taxCodeMap: Record<
            string,
            { code: string; percentage_code: string }
          > = {
            IVA_0: { code: "2", percentage_code: "0" },
            IVA_5: { code: "2", percentage_code: "5" },
            IVA_12: { code: "2", percentage_code: "2" },
            IVA_14: { code: "2", percentage_code: "3" },
            IVA_15: { code: "2", percentage_code: "4" },
            EXENTO_IVA: { code: "2", percentage_code: "6" },
          };

          const sriTax = taxCodeMap[item.tax];
          if (!sriTax) return;

          const key = `${sriTax.code}-${sriTax.percentage_code}`;

          if (!taxMap[key]) {
            taxMap[key] = {
              code: sriTax.code,
              percentage_code: sriTax.percentage_code,
              base: 0,
              amount: 0,
              documentId: updatedDocument.id, // ya lo puedes poner aquí
            };
          }

          taxMap[key].base += Number(item.subtotal || 0);
          taxMap[key].amount += Number(item.taxAmount || 0);
        });

        const taxesToCreate = Object.values(taxMap);

        if (taxesToCreate.length) {
          await tx.documentTax.createMany({
            data: taxesToCreate,
            skipDuplicates: true,
          });
        }
      }

      // 3. Reemplazar payments
      await tx.documentPayment.deleteMany({
        where: { documentId: id },
      });

      if (data.documentPayments?.length) {
        await tx.documentPayment.createMany({
          data: data.documentPayments.map((p) => ({
            ...p,
            documentId: id,
          })),
        });
      }

      // 4. Actualizar asiento contable
      const resJournalData = await getJournalEntriesByDocument(
        tx,
        updatedDocument.id
      );

      if (!resJournalData.success || !resJournalData.data) {
        throw new Error(
          resJournalData.error ||
            "Error obteniendo datos para el asiento contable"
        );
      }

      // registrar asiento contable
      const journalData: CreateJournalEntry | null =
        resJournalData.success && resJournalData.data
          ? resJournalData.data
          : null;

      if (!journalData) {
        throw new Error("Error obteniendo datos para el asiento contable");
      }

      // Valida si el documento ya tiene un asiento contable asociado
      const existingJournals = await tx.journalEntry.findMany({
        where: {
          sourceType: "DOCUMENT",
          sourceId: updatedDocument.id,
        },
      });

      // Si ya existe un asiento, eliminarlo antes de crear uno nuevo
      for (const journal of existingJournals) {
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: journal.id },
        });
        await tx.journalEntry.delete({
          where: { id: journal.id },
        });
      }

      // 4. Actualizar asiento contable
      const restJournal = await createJournalEntryTx(
        tx,
        updatedDocument.tenantId,
        journalData
      );

      if (!restJournal.success) {
        throw new Error(
          restJournal.error || "Error creando el asiento contable"
        );
      }
    }

    // 4. Registros para WITHHOLDING
    if (data.documentType === "WITHHOLDING" && data.withholding) {
      const withholdingData = {
        ...data.withholding,
        id: data.withholding.id ?? undefined,
      };

      // crea la retención asociada al documento
      const resWithholding = await updateWithholdingTx(
        tx,
        withholdingData.id!,
        withholdingData
      );

      if (!resWithholding.success) {
        return {
          success: false,
          error: resWithholding.error || "Error creando la retención",
        };
      }

      // Calcula el balance restando el monto pagado del total del documento base
      const newWithholding = resWithholding.data!;
      const totalWithheld = newWithholding.totalWithheld || 0;

      // si tiene documento relacionado, actualiza el total retenido en el documento base
      if (data.relatedDocumentId!) {
        // obtiene el documento relacionado
        const relatedDoc = await tx.document.findUnique({
          where: { id: data.relatedDocumentId! },
        });

        if (relatedDoc) {
          const balance =
            relatedDoc.total - (relatedDoc.paidAmount || 0) - totalWithheld;

          await tx.document.update({
            where: { id: data.relatedDocumentId! },
            data: {
              totalWithheld: totalWithheld,
              balance: balance,
            },
          });
        }
      }

      // 4. Actualizar asiento contable
      const resJournalData = await getJournalEntriesByDocument(
        tx,
        updatedDocument.id
      );

      if (!resJournalData.success || !resJournalData.data) {
        throw new Error(
          resJournalData.error ||
            "Error obteniendo datos para el asiento contable"
        );
      }

      // registrar asiento contable
      const journalData: CreateJournalEntry | null =
        resJournalData.success && resJournalData.data
          ? resJournalData.data
          : null;

      if (!journalData) {
        throw new Error("Error obteniendo datos para el asiento contable");
      }

      // Valida si el documento ya tiene un asiento contable asociado
      const existingJournals = await tx.journalEntry.findMany({
        where: {
          sourceType: "DOCUMENT",
          sourceId: updatedDocument.id,
        },
      });

      // Si ya existe un asiento, eliminarlo antes de crear uno nuevo
      for (const journal of existingJournals) {
        await tx.journalEntryLine.deleteMany({
          where: { journalEntryId: journal.id },
        });
        await tx.journalEntry.delete({
          where: { id: journal.id },
        });
      }

      // 4. Actualizar asiento contable
      const restJournal = await createJournalEntryTx(
        tx,
        updatedDocument.tenantId,
        journalData
      );

      if (!restJournal.success) {
        throw new Error(
          restJournal.error || "Error creando el asiento contable"
        );
      }
    }

    const formattedDocument: DocumentResponse = {
      ...updatedDocument,
      number: updatedDocument.number || undefined,
      dueDate: updatedDocument.dueDate || undefined,
      description: updatedDocument.description || undefined,
      documentType: updatedDocument.documentType as $Enums.DocumentType,
    };

    return { success: true, data: formattedDocument };
  } catch (error: any) {
    console.error("Error updating document:", error);
    return {
      success: false,
      error: error.message || "Error actualizando el documento",
    };
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
        documentFiscalInfo: {
          include: {
            establishment: true,
            emissionPoint: true,
          },
        },
      },
    });

    if (!document) {
      return { success: false, error: "Documento no encontrado" };
    }

    const formattedDocument: DocumentResponse = {
      ...document,
      entityType: document.entityType,
      documentType: document.documentType as $Enums.DocumentType,
      number: document.number || undefined,
      issueDate: document.issueDate,
      dueDate: document.dueDate || undefined,
      status: document.status as "DRAFT" | "CONFIRMED" | "CANCELED",
      personId: document.personId,
      subtotal: document.subtotal,
      taxTotal: document.taxTotal,
      discount: document.discount,
      total: document.total,
      paidAmount: document.paidAmount,
      balance: document.balance,
      description: document.description || undefined,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      documentFiscalInfo: document.documentFiscalInfo || undefined,
      relatedDocumentId: document.relatedDocumentId || undefined,
      person: document.person
        ? {
            id: document.person.id,
            identification: document.person.identification || undefined,
            fullname: document.person.firstName
              ? `${document.person.firstName} ${document.person.lastName}`
              : document.person.businessName || undefined,
          }
        : undefined,
    };

    return { success: true, data: formattedDocument };
  } catch (error) {
    console.error("Error fetching document:", error);
    return { success: false, error: "Error fetching document" };
  }
};

export const getInvoicePaymentMethods = async (
  documentId: string
): Promise<{
  success: boolean;
  data?: DocumentPayment[];
  error?: string;
}> => {
  try {
    const paymentMethods = await prisma.documentPayment.findMany({
      where: { documentId },
    });

    const formattedPaymentMethods = paymentMethods.map((method) => ({
      ...method,
      term: method.term !== undefined ? method.term : null,
      termUnit: method.termUnit !== undefined ? method.termUnit : null,
    }));

    return { success: true, data: formattedPaymentMethods };
  } catch (error) {
    console.error("Error fetching document payment methods:", error);
    return { success: false, error: "Error fetching document payment methods" };
  }
};

export const getInvoiceDataForPDF = async (
  documentId: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        tenant: {
          include: {
            sriConfiguration: true,
          },
        },
        person: true,
        items: {
          include: { product: true },
        },
        taxes: true,
        documentPayments: true,
        documentFiscalInfo: {
          include: {
            emissionPoint: {
              include: {
                establishment: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    const totalSinImpuestos = document.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const totalDescuento = document.items.reduce(
      (sum, item) => sum + item.discountAmount,
      0
    );

    const impuestos = document.taxes.map((tax) => ({
      codigo: tax.code,
      codigoPorcentaje: tax.percentage_code,
      baseImponible: tax.base,
      valor: tax.amount,
    }));

    // Aquí puedes formatear los items y métodos de pago según lo que necesites en el PDF
    const detalles = document.items.map((item) => ({
      codigoPrincipal: item.product.code,
      descripcion: item.product.description,
      cantidad: item.quantity,
      precioUnitario: item.unitPrice,
      descuento: item.discountAmount,
      precioTotalSinImpuesto: item.subtotal,
    }));

    const pagos = document.documentPayments.map((method) => ({
      formaPago: method.paymentMethod,
      total: method.amount,
      plazo: method.term ? method.term.toString() : "0",
      unidadTiempo: method.termUnit || "DÍAS",
    }));

    const subtotal15 =
      impuestos.find((tax) => tax.codigoPorcentaje === "4")?.baseImponible || 0;
    const subtotal5 =
      impuestos.find((tax) => tax.codigoPorcentaje === "5")?.baseImponible || 0;
    const subtotal0 =
      impuestos.find((tax) => tax.codigoPorcentaje === "0")?.baseImponible || 0;
    const subtotalNoObjetoIVA =
      impuestos.find((tax) => tax.codigoPorcentaje === "7")?.baseImponible || 0;

    const iva15 =
      impuestos.find((tax) => tax.codigoPorcentaje === "4")?.valor || 0;
    const iva5 =
      impuestos.find((tax) => tax.codigoPorcentaje === "5")?.valor || 0;

    const importeTotal = document.total;

    const totals = [];
    totals.push({ label: "Subtotal 15%", value: subtotal15 });
    totals.push({ label: "Subtotal 5%", value: subtotal5 });
    totals.push({ label: "Subtotal 0%", value: subtotal0 });
    totals.push({
      label: "Subtotal No Objeto IVA",
      value: subtotalNoObjetoIVA,
    });
    totals.push({ label: "Descuento", value: totalDescuento });
    totals.push({ label: "ICE", value: 0 });
    totals.push({ label: "IVA 15%", value: iva15 });
    totals.push({ label: "IVA 5%", value: iva5 });
    totals.push({ label: "Servicio %", value: 0 });
    totals.push({ label: "Valor Total", value: importeTotal });

    // Aquí puedes formatear los datos según lo que necesites en el PDF
    const invoiceData = {
      emisor: {
        logoUrl: document.tenant.logoUrl,
        razonSocial: document.tenant.legalName || document.tenant.tradeName,
        ruc: document.tenant.ruc,
        direccionMatriz: document.tenant.address,
        correo: document.tenant.email,
        telefono: document.tenant.phone,
        obligadoContabilidad: document.tenant.obligatedAccounting ? "SI" : "NO",
        regimenRimpe: "",
      },
      infoTributaria: {
        ambiente:
          document.tenant.sriConfiguration?.environment === "TEST"
            ? "PRUEBAS"
            : "PRODUCCIÓN",
        tipoEmision: "NORMAL",
        estab: document.documentFiscalInfo?.emissionPoint.establishment.code,
        ptoEmi: document.documentFiscalInfo?.emissionPoint?.code,
        secuencial: document.documentFiscalInfo?.sequence
          ?.toString()
          .padStart(9, "0"),
        claveAcceso: document.documentFiscalInfo?.accessKey || "",
      },
      autorizacion: {
        numeroAutorizacion: document.documentFiscalInfo?.authorization || "",
        fechaAutorizacion:
          document.documentFiscalInfo?.authorizationDate?.toISOString() || "",
      },
      comprador: {
        razonSocial: `${document.person.firstName} ${document.person.lastName}`,
        identificacion: document.person.identification,
        direccion: document.person.address || "",
        telefono: document.person.phone,
        correo: document.person.email,
      },
      infoFactura: {
        fechaEmision: formatDate(document.issueDate.toISOString()),
        totalSinImpuestos: totalSinImpuestos,
        totalDescuento: totalDescuento,
        impuestos: impuestos,
        propina: 0,
        importeTotal: importeTotal,
        pagos: pagos,
      },
      infoAdicional: [
        {
          nombre: "Descripción",
          valor: document.description || "",
        },
      ],
      detalles: detalles,
      totals: totals,
    };

    return { success: true, data: invoiceData };
  } catch (error) {
    console.error("Error fetching document data for PDF:", error);
    return { success: false, error: "Error fetching document data for PDF" };
  }
};

export const updateInvoiceXmlFile = async (
  documentId: string,
  xmlFilePath: string,
  xmlFileUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.documentFiscalInfo.update({
      where: { id: documentId },
      data: { authorizedXmlUrl: xmlFilePath },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating XML path for document:", error);
    return { success: false, error: "Error updating XML path for document" };
  }
};

export const validateDocument = async (
  data: CreateDocument
): Promise<{ success: boolean; error?: string }> => {
  if (!data.personId) {
    return {
      success: false,
      error: "El cliente/proveedor es obligatorio",
    };
  }

  // Validar pagos solo para facturas de clientes
  if (data.entityType === "CUSTOMER" && data.documentType === "INVOICE") {
    const totalPayments =
      data.documentPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    if (totalPayments !== data.total) {
      return {
        success: false,
        error: "El total de pagos debe ser igual al total del documento",
      };
    }
  }

  // Valida que el detalle del documento no tenga campos vacíos
  if (data.items) {
    for (const item of data.items) {
      if (
        !item.warehouseId ||
        !item.productId ||
        item.quantity <= 0 ||
        item.unitPrice < 0
      ) {
        return {
          success: false,
          error: "El detalle del documento contiene campos vacíos o inválidos",
        };
      }
    }
  }

  return { success: true };
};

export const getDocumentWithholding = async (
  documentId: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const document = await prisma.document.findFirst({
      where: { relatedDocumentId: documentId, documentType: "WITHHOLDING" },
      include: {
        person: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!document) {
      return { success: false, error: "Documento no encontrado" };
    }

    return { success: true, data: document };
  } catch (error) {
    console.error("Error al obtener datos de retención del documento:", error);
    return {
      success: false,
      error: "Error al obtener datos de retención del documento",
    };
  }
};
