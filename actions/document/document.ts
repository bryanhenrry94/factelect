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

export const getDocuments = async (
  tenantId: string,
  personId?: string
): Promise<{ success: boolean; data?: DocumentResponse[]; error?: string }> => {
  try {
    const whereClause: Prisma.DocumentWhereInput = {
      tenantId,
      ...(personId && { personId }),
    };

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        person: true,
      },
    });

    const formattedDocuments: DocumentResponse[] = documents.map(
      (document) => ({
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
        person: document.person
          ? {
              id: document.person.id,
              identification: document.person.identification || undefined,
              fullname: document.person.firstName
                ? `${document.person.firstName} ${document.person.lastName}`
                : document.person.businessName || undefined,
            }
          : undefined,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      })
    );

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
  data: CreateDocument,
  tenantId: string
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    const balance = data.total - (data.paidAmount || 0);

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

    const result = await prisma.$transaction(async (tx) => {
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

      return newDocument;
    });

    // Se formatea solo al final, fuera de la transacción
    const formattedDocument: DocumentResponse = {
      ...result,
      number: result.number || undefined,
      dueDate: result.dueDate || undefined,
      description: result.description || undefined,
      documentType: result.documentType as $Enums.DocumentType,
    };

    return { success: true, data: formattedDocument };
  } catch (error) {
    console.error("Error creating document:", error);
    return { success: false, error: "Error creando el documento" };
  }
};

export const updateDocument = async (
  id: string,
  data: Partial<CreateDocument>
): Promise<{ success: boolean; data?: DocumentResponse; error?: string }> => {
  try {
    // Validar total de pagos solo para facturas de clientes
    if (data.entityType === "CUSTOMER" && data.documentType === "INVOICE") {
      const totalPayments =
        data.documentPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      if (data.total !== undefined && totalPayments !== data.total) {
        return {
          success: false,
          error: "El total de pagos debe ser igual al total del documento",
        };
      }
    }

    const updatedDocument = await prisma.$transaction(async (tx) => {
      // 1. Actualizar documento
      const doc = await tx.document.update({
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
          balance:
            data.total && data.paidAmount !== undefined
              ? data.total - data.paidAmount
              : data.balance, // recalculo seguro
          description: data.description || undefined,
        },
        include: { person: true },
      });

      // 2. Items (delete + recreate)
      if (data.items) {
        await tx.documentItem.deleteMany({ where: { documentId: id } });

        if (data.items.length > 0) {
          await tx.documentItem.createMany({
            data: data.items.map((item) => ({ ...item, documentId: id })),
            skipDuplicates: true,
          });
        }
      }

      // 3. Pagos (delete + recreate)
      if (data.documentPayments) {
        await tx.documentPayment.deleteMany({ where: { documentId: id } });

        if (data.documentPayments.length > 0) {
          await tx.documentPayment.createMany({
            data: data.documentPayments.map((p) => ({
              ...p,
              documentId: id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return doc;
    });

    // Formato de respuesta
    const formattedDocument: DocumentResponse = {
      ...updatedDocument,
      number: updatedDocument.number || undefined,
      dueDate: updatedDocument.dueDate || undefined,
      description: updatedDocument.description || undefined,
      person: updatedDocument.person
        ? {
            id: updatedDocument.person.id,
            fullname: updatedDocument.person.firstName
              ? `${updatedDocument.person.firstName} ${updatedDocument.person.lastName}`
              : updatedDocument.person.businessName || undefined,
            identification: updatedDocument.person.identification || undefined,
          }
        : undefined,
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
