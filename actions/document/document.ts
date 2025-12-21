"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateDocument,
  DocumentItem,
  DocumentResponse,
} from "@/lib/validations";
import { $Enums, DocumentPayment } from "@/prisma/generated/prisma";
import { formatDate } from "@/utils/formatters";

import { Prisma } from "@/prisma/generated/prisma";
import {
  createJournalEntryTx,
  getJournalEntriesDocumentData,
} from "../accounting/journal-entry";

export interface DocumentFilter {
  tenantId: string;
  search?: string;
  personId?: string;
  entityType?: $Enums.EntityType;
  documentType?: $Enums.DocumentType;
  dateFrom?: Date;
  dateTo?: Date;
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

      const establishmentCode = documentFiscalInfo?.establishment.code ?? "";
      const emissionPointCode = documentFiscalInfo?.emissionPoint.code ?? "";
      const sequence =
        documentFiscalInfo?.sequence?.toString().padStart(9, "0") ?? "";

      const documentNumber =
        establishmentCode && emissionPointCode && sequence
          ? `${establishmentCode}-${emissionPointCode}-${sequence}`
          : undefined;

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
        person: person
          ? {
              id: person.id,
              identification: person.identification || undefined,
              fullname,
            }
          : undefined,
        documentNumber,
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
    await prisma.document.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Error deleting document" };
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

      // 2️⃣ Obtener datos para asiento contable
      const journalData = await getJournalEntriesDocumentData(
        tx,
        resultDocument.data.id
      );

      // 3️⃣ Crear asiento contable
      const journal = await createJournalEntryTx(tx, tenantId, journalData);

      return { document: resultDocument.data, journal };
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
      return { success: false, error: "Datos del documento inválidos" };
    }

    const balance = data.total - (data.paidAmount || 0);

    // Valida que el detalle del documento no tenga campos vacios
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

    // 1. Crear documento
    const newDocument = await tx.document.create({
      data: {
        tenantId,
        entityType: data.entityType,
        documentType: data.documentType as $Enums.DocumentType,
        number: data.number || undefined,
        issueDate: data.issueDate,
        dueDate: data.dueDate || undefined,
        status: data.status,
        personId: data.personId,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discount: data.discount,
        total: data.total,
        paidAmount: data.paidAmount,
        balance,
        description: data.description || undefined,
      },
    });

    // 2. Items
    if (data.items?.length) {
      await tx.documentItem.createMany({
        data: data.items.map((item) => ({
          ...item,
          documentId: newDocument.id,
        })),
        skipDuplicates: true,
      });
    }

    // 3. Fiscal Info + actualizar secuencia
    if (data.fiscalInfo) {
      await tx.documentFiscalInfo.create({
        data: {
          documentId: newDocument.id,
          establishmentId: data.fiscalInfo.establishmentId,
          emissionPointId: data.fiscalInfo.emissionPointId,
          sequence: data.fiscalInfo.sequence,
          environment: data.fiscalInfo.environment,
          sriStatus: data.fiscalInfo.sriStatus,
        },
      });

      await tx.sequenceControl.update({
        where: {
          tenantId_establishmentId_emissionPointId_documentType: {
            tenantId,
            establishmentId: data.fiscalInfo.establishmentId,
            emissionPointId: data.fiscalInfo.emissionPointId,
            documentType: data.documentType as $Enums.DocumentType,
          },
        },
        data: {
          currentSequence: data.fiscalInfo.sequence + 1,
        },
      });
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

    // Se formatea solo al final, fuera de la transacción
    const formattedDocument: DocumentResponse = {
      ...newDocument,
      number: newDocument.number || undefined,
      dueDate: newDocument.dueDate || undefined,
      description: newDocument.description || undefined,
      documentType: newDocument.documentType as $Enums.DocumentType,
    };

    return { success: true, data: formattedDocument };
  } catch (error) {
    console.error("Error creating document:", error);
    return { success: false, error: "Error creando el documento" };
  }
};

export const updateDocument = async (
  tenantId: string,
  id: string,
  data: CreateDocument
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Actualizar documento
      const resultDocument = await updateDocumentTx(tx, id, data);

      if (!resultDocument.success || !resultDocument.data) {
        throw new Error(
          resultDocument.error || "Error actualizando el documento"
        );
      }

      // 2️⃣ Obtener datos para asiento contable
      const journalData = await getJournalEntriesDocumentData(
        tx,
        resultDocument.data.id
      );

      // Valida si el documento ya tiene un asiento contable asociado
      const existingJournals = await tx.journalEntry.findMany({
        where: {
          sourceType: "DOCUMENT",
          sourceId: resultDocument.data.id,
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

      // 3️⃣ Crear asiento contable
      const journal = await createJournalEntryTx(tx, tenantId, journalData);

      return { document: resultDocument.data, journal };
    });

    return { success: true, data: result.document };
  } catch (error) {
    console.error("Error updating document:", error);
    return { success: false, error: "Error actualizando el documento" };
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
      return { success: false, error: "Datos del documento inválidos" };
    }

    const balance = data.total - (data.paidAmount || 0);

    // 1. Actualizar documento
    const updatedDocument = await tx.document.update({
      where: {
        id,
      },
      data: {
        entityType: data.entityType,
        documentType: data.documentType as $Enums.DocumentType,
        number: data.number || undefined,
        issueDate: data.issueDate,
        dueDate: data.dueDate || undefined,
        status: data.status,
        personId: data.personId,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discount: data.discount,
        total: data.total,
        paidAmount: data.paidAmount,
        balance,
        description: data.description || undefined,
      },
    });

    // 2. Reemplazar items
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

    // 3. Fiscal Info (update o create)
    if (data.fiscalInfo) {
      const existingFiscal = await tx.documentFiscalInfo.findUnique({
        where: { documentId: id },
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

    // 4. Reemplazar payments
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

    const formattedDocument: DocumentResponse = {
      ...updatedDocument,
      number: updatedDocument.number || undefined,
      dueDate: updatedDocument.dueDate || undefined,
      description: updatedDocument.description || undefined,
      documentType: updatedDocument.documentType as $Enums.DocumentType,
    };

    return { success: true, data: formattedDocument };
  } catch (error) {
    console.error("Error updating document:", error);
    return { success: false, error: "Error actualizando el documento" };
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

    const documentNumber = `${
      document.documentFiscalInfo?.establishment.code
    }-${
      document.documentFiscalInfo?.emissionPoint.code
    }-${document.documentFiscalInfo?.sequence.toString().padStart(9, "0")}`;

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
      documentNumber: documentNumber,
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
            sriConfig: true,
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
      impuestos.find((tax) => tax.codigoPorcentaje === "5")?.baseImponible || 0;
    const subtotal5 =
      impuestos.find((tax) => tax.codigoPorcentaje === "6")?.baseImponible || 0;
    const subtotal0 =
      impuestos.find((tax) => tax.codigoPorcentaje === "0")?.baseImponible || 0;
    const subtotalNoObjetoIVA =
      impuestos.find((tax) => tax.codigoPorcentaje === "7")?.baseImponible || 0;

    const iva15 =
      impuestos.find((tax) => tax.codigoPorcentaje === "5")?.valor || 0;
    const iva5 =
      impuestos.find((tax) => tax.codigoPorcentaje === "6")?.valor || 0;

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
        razonSocial: document.tenant.name || document.tenant.tradeName,
        ruc: document.tenant.ruc,
        direccionMatriz: document.tenant.address,
        correo: document.tenant.contactEmail,
        telefono: document.tenant.phone,
        obligadoContabilidad: document.tenant.obligatedAccounting ? "SI" : "NO",
        regimenRimpe: "",
      },
      infoTributaria: {
        ambiente:
          document.tenant.sriConfig?.environment === "TEST"
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

  return { success: true };
};
