"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateDocument,
  DocumentItem,
  DocumentResponse,
} from "@/lib/validations";
import { $Enums, DocumentPayment } from "@/prisma/generated/prisma";
import { formatDate } from "@/utils/formatters";

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

    const allowedDocumentTypes: Array<
      "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE"
    > = ["INVOICE", "CREDIT_NOTE", "DEBIT_NOTE"];

    const formattedDocuments: DocumentResponse[] = documents
      .filter((document) =>
        allowedDocumentTypes.includes(document.documentType as any)
      )
      .map((document) => ({
        ...document,
        entityType: document.entityType,
        documentType: document.documentType as
          | "INVOICE"
          | "CREDIT_NOTE"
          | "DEBIT_NOTE",
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
        person: document.person
          ? {
              id: document.person.id,
              firstName: document.person.firstName,
              lastName: document.person.lastName,
              identification: document.person.identification || undefined,
            }
          : undefined,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      }));

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
    console.error("Error deleting document:", error);
    return { success: false, error: "Error deleting document" };
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
        documentType: data.documentType as $Enums.DocumentType,
        number: data.number || undefined,
        issueDate: data.issueDate,
        dueDate: data.dueDate || undefined,
        status: data.status as "DRAFT" | "CONFIRMED" | "CANCELED",
        personId: data.personId,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        discount: data.discount,
        total: data.total,
        paidAmount: data.paidAmount,
        balance: balance,
        description: data.description || undefined,
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
      entityType: newDocument.entityType,
      documentType: newDocument.documentType as
        | "INVOICE"
        | "CREDIT_NOTE"
        | "DEBIT_NOTE",
      number: newDocument.number || undefined,
      issueDate: newDocument.issueDate,
      dueDate: newDocument.dueDate || undefined,
      status: newDocument.status as "DRAFT" | "CONFIRMED" | "CANCELED",
      personId: newDocument.personId,
      subtotal: newDocument.subtotal,
      taxTotal: newDocument.taxTotal,
      discount: newDocument.discount,
      total: newDocument.total,
      paidAmount: newDocument.paidAmount,
      balance: newDocument.balance,
      description: newDocument.description || undefined,
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
      await prisma.sequenceControl.update({
        where: {
          tenantId_establishmentId_emissionPointId_documentType: {
            tenantId,
            establishmentId: fiscalInfo.establishmentId,
            emissionPointId: fiscalInfo.emissionPointId,
            documentType: data.documentType as $Enums.DocumentType,
          },
        },
        data: {
          currentSequence: fiscalInfo.sequence + 1,
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
      entityType: updatedDocument.entityType,
      documentType: updatedDocument.documentType as
        | "INVOICE"
        | "CREDIT_NOTE"
        | "DEBIT_NOTE",
      number: updatedDocument.number || undefined,
      issueDate: updatedDocument.issueDate,
      dueDate: updatedDocument.dueDate || undefined,
      status: updatedDocument.status as "DRAFT" | "CONFIRMED" | "CANCELED",
      personId: updatedDocument.personId,
      subtotal: updatedDocument.subtotal,
      taxTotal: updatedDocument.taxTotal,
      discount: updatedDocument.discount,
      total: updatedDocument.total,
      paidAmount: updatedDocument.paidAmount,
      balance: updatedDocument.balance,
      description: updatedDocument.description || undefined,
      person: updatedDocument.person
        ? {
            id: updatedDocument.person.id,
            fullname:
              updatedDocument.person.firstName
                ? `${updatedDocument.person.firstName} ${updatedDocument.person.lastName}`
                : updatedDocument.person.businessName || undefined,
            identification: updatedDocument.person.identification || undefined,
          }
        : undefined,
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
      entityType: document.entityType,
      documentType: document.documentType as
        | "INVOICE"
        | "CREDIT_NOTE"
        | "DEBIT_NOTE",
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
