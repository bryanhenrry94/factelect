"use server";
import { prisma } from "@/lib/prisma";
import {
  InvoiceForm,
  Invoice,
  InvoiceResponse,
} from "@/lib/validations/invoice";
import { InvoiceItemResponse } from "@/lib/validations/invoice-item";
import { InvoicePaymentMethod } from "@/lib/validations/invoice-payment-method";
import { formatDate } from "@/utils/formatters";
import { generateBarcodeBase64 } from "@/lib/barcode";

export const createInvoice = async (
  invoice: InvoiceForm,
  tenantId: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    if (!tenantId) throw new Error("El parametro tenantId es obligatorio");

    // validar que el total de la factura sea mayor a cero
    if (invoice.total <= 0) {
      return {
        success: false,
        error: "El total de la factura debe ser mayor a cero",
      };
    }

    // validar que el total de los items sea igual al total de la factura
    const itemsTotal = invoice.items.reduce((acc, item) => acc + item.total, 0);
    if (itemsTotal !== invoice.total) {
      return {
        success: false,
        error: "El total de los items no coincide con el total de la factura",
      };
    }

    // validar que el total de la factura sea igual a la suma de los metodos de pago
    const paymentMethodsTotal = invoice.paymentMethods.reduce(
      (acc, method) => acc + method.amount,
      0
    );
    if (paymentMethodsTotal !== invoice.total) {
      return {
        success: false,
        error:
          "El total de los métodos de pago no coincide con el total de la factura",
      };
    }

    // validar que el sequential sea unico por punto de emision
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        emissionPointId: invoice.emissionPointId,
        sequential: invoice.sequential,
      },
    });
    if (existingInvoice) {
      return {
        success: false,
        error:
          "El número secuencial ya existe para el punto de emisión seleccionado",
      };
    }

    // Crear la factura
    const newInvoice = await prisma.invoice.create({
      data: {
        customerId: invoice.customerId,
        establishmentId: invoice.establishmentId,
        emissionPointId: invoice.emissionPointId,
        sequential: invoice.sequential,
        status: invoice.status,
        issueDate: invoice.issueDate,
        term: invoice.term,
        dueDate: invoice.dueDate,
        total: invoice.total,
        description: invoice.description,
        tenantId: tenantId,
      },
    });

    // Crear los items asociados a la factura
    if (newInvoice && invoice.items.length > 0) {
      const itemsData = invoice.items.map((item) => {
        return {
          invoiceId: newInvoice.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tax: item.tax,
          taxAmount: item.taxAmount,
          discountRate: item.discountRate,
          discountAmount: item.discountAmount,
          subtotal: item.subtotal,
          total: item.total,
        };
      });

      await prisma.invoiceItem.createMany({
        data: itemsData,
      });
    }

    if (newInvoice && invoice.paymentMethods.length > 0) {
      const paymentMethodsData = invoice.paymentMethods.map((method) => {
        return {
          invoiceId: newInvoice.id,
          paymentMethod: method.paymentMethod,
          term: method.term,
          timeUnit: method.timeUnit,
          amount: method.amount,
        };
      });

      await prisma.invoicePaymentMethod.createMany({
        data: paymentMethodsData,
      });
    }

    // guarda InvoiceTax
    if (newInvoice && invoice.items.length > 0) {
      // Mapeo de tipos de impuesto a su configuración
      const taxConfig = {
        IVA_0: { code: "2", percentage_code: "0", percentage: 0 },
        IVA_5: { code: "2", percentage_code: "5", percentage: 5 },
        IVA_15: { code: "2", percentage_code: "4", percentage: 15 },
        NO_IVA: { code: "2", percentage_code: "6", percentage: 0 },
        EXENTO_IVA: { code: "2", percentage_code: "7", percentage: 0 },
      };

      // Generar todos los datos de impuestos existentes
      const invoiceTaxes = Object.entries(taxConfig)
        .map(([taxType, { code, percentage_code, percentage }]) => {
          const filtered = invoice.items.filter((item) => item.tax === taxType);
          if (filtered.length === 0) return null;

          const base = filtered.reduce((sum, item) => sum + item.subtotal, 0);
          const amount = (base * percentage) / 100;

          return {
            invoiceId: newInvoice.id,
            code: code,
            percentage_code: percentage_code,
            base,
            amount,
          };
        })
        .filter(Boolean); // elimina los null

      // Crear todos los registros en paralelo (más eficiente)
      await Promise.all(
        invoiceTaxes.map((data) => prisma.invoiceTax.create({ data: data! }))
      );
    }

    // update sequential in emission point
    await prisma.emissionPoint.update({
      where: { id: invoice.emissionPointId },
      data: {
        currentInvoiceSequence: invoice.sequential + 1,
      },
    });

    return { success: true, data: newInvoice };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return { success: false, error: "Error creating invoice" };
  }
};

export const updateInvoice = async (
  id: string,
  invoice: InvoiceForm
): Promise<{ success: boolean; data?: Invoice; error?: string }> => {
  try {
    // validar que el total de la factura sea mayor a cero
    if (invoice.total <= 0) {
      return {
        success: false,
        error: "El total de la factura debe ser mayor a cero",
      };
    }

    // validar que el total de los items sea igual al total de la factura
    const itemsTotal = invoice.items.reduce((acc, item) => acc + item.total, 0);
    if (itemsTotal !== invoice.total) {
      return {
        success: false,
        error: "El total de los items no coincide con el total de la factura",
      };
    }

    // validar que el total de la factura sea igual a la suma de los metodos de pago
    const paymentMethodsTotal = invoice.paymentMethods.reduce(
      (acc, method) => acc + method.amount,
      0
    );
    if (paymentMethodsTotal !== invoice.total) {
      return {
        success: false,
        error:
          "El total de los métodos de pago no coincide con el total de la factura",
      };
    }

    const invoiceUpdated = await prisma.invoice.update({
      where: { id },
      data: {
        customerId: invoice.customerId,
        establishmentId: invoice.establishmentId,
        emissionPointId: invoice.emissionPointId,
        sequential: invoice.sequential,
        status: invoice.status,
        issueDate: invoice.issueDate,
        term: invoice.term,
        dueDate: invoice.dueDate,
        total: invoice.total,
        description: invoice.description,
      },
    });

    // Eliminar items existentes
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Crear nuevos items
    if (invoice && invoice.items.length > 0) {
      const itemsData = invoice.items.map((item) => {
        return {
          invoiceId: invoiceUpdated.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tax: item.tax,
          taxAmount: item.taxAmount,
          discountRate: item.discountRate,
          discountAmount: item.discountAmount,
          subtotal: item.subtotal,
          total: item.total,
        };
      });

      await prisma.invoiceItem.createMany({
        data: itemsData,
      });
    }

    // Eliminar métodos de pago existentes
    await prisma.invoicePaymentMethod.deleteMany({
      where: { invoiceId: id },
    });

    // Crear nuevos métodos de pago
    if (invoice && invoice.paymentMethods.length > 0) {
      const paymentMethodsData = invoice.paymentMethods.map((method) => {
        return {
          invoiceId: invoiceUpdated.id,
          paymentMethod: method.paymentMethod,
          term: method.term,
          timeUnit: method.timeUnit,
          amount: method.amount,
        };
      });

      await prisma.invoicePaymentMethod.createMany({
        data: paymentMethodsData,
      });
    }

    // Eliminar impuestos existentes
    await prisma.invoiceTax.deleteMany({
      where: { invoiceId: id },
    });

    // guarda InvoiceTax
    if (invoiceUpdated && invoice.items.length > 0) {
      // Mapeo de tipos de impuesto a su configuración
      const taxConfig = {
        IVA_0: { code: "2", percentage_code: "0", percentage: 0 },
        IVA_5: { code: "2", percentage_code: "5", percentage: 5 },
        IVA_15: { code: "2", percentage_code: "4", percentage: 15 },
        NO_IVA: { code: "2", percentage_code: "6", percentage: 0 },
        EXENTO_IVA: { code: "2", percentage_code: "7", percentage: 0 },
      };

      // Generar todos los datos de impuestos existentes
      const invoiceTaxes = Object.entries(taxConfig)
        .map(([taxType, { code, percentage_code, percentage }]) => {
          const filtered = invoice.items.filter((item) => item.tax === taxType);
          if (filtered.length === 0) return null;

          const base = filtered.reduce((sum, item) => sum + item.subtotal, 0);
          const amount = (base * percentage) / 100;

          return {
            invoiceId: id,
            code: code,
            percentage_code: percentage_code,
            base,
            amount,
          };
        })
        .filter(Boolean); // elimina los null

      // Crear todos los registros en paralelo (más eficiente)
      await Promise.all(
        invoiceTaxes.map((data) => prisma.invoiceTax.create({ data: data! }))
      );
    }

    return { success: true, data: invoiceUpdated };
  } catch (error) {
    console.error("Error updating invoice:", error);
    return { success: false, error: "Error updating invoice" };
  }
};

export const getInvoices = async (
  tenantId: string
): Promise<{ success: boolean; data?: InvoiceResponse[]; error?: string }> => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      include: {
        customer: true,
        emissionPoint: {
          include: {
            establishment: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedInvoices = invoices.map((invoice) => ({
      ...invoice,
      status: invoice.status as
        | "DRAFT"
        | "SIGNED"
        | "SENT"
        | "AUTHORIZED"
        | "REJECTED"
        | "CANCELED",
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        identification: invoice.customer.identification,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
      },
      document: `${invoice.emissionPoint.establishment.code}-${
        invoice.emissionPoint.code
      }-${String(invoice.sequential).padStart(9, "0")}`,
    }));

    return { success: true, data: formattedInvoices };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return { success: false, error: "Error fetching invoices" };
  }
};

export const deleteInvoice = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.invoice.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return { success: false, error: "Hubo un error al eliminar la factura" };
  }
};

export const getInvoice = async (
  id: string
): Promise<{ success: boolean; data?: InvoiceResponse; error?: string }> => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        emissionPoint: {
          include: {
            establishment: true,
          },
        },
        items: true,
        paymentMethods: true,
        taxes: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Factura no encontrada" };
    }

    const formattedInvoice: InvoiceResponse = {
      ...invoice,
      status: invoice.status as
        | "DRAFT"
        | "SIGNED"
        | "SENT"
        | "AUTHORIZED"
        | "REJECTED"
        | "CANCELED",
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        identification: invoice.customer.identification,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
      },
      document: `${invoice.emissionPoint.establishment.code}-${
        invoice.emissionPoint.code
      }-${String(invoice.sequential).padStart(9, "0")}`,
    };

    return { success: true, data: formattedInvoice };
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return { success: false, error: "Error fetching invoice" };
  }
};

export const getInvoiceItems = async (
  invoiceId: string
): Promise<{
  success: boolean;
  data?: InvoiceItemResponse[];
  error?: string;
}> => {
  try {
    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId },
      include: {
        product: true,
      },
    });

    const formattedItems: InvoiceItemResponse[] = items.map((item) => ({
      ...item,
      product: {
        id: item.product.id,
        code: item.product.code,
        description: item.product.description,
        price: item.product.price,
      },
    }));

    return { success: true, data: formattedItems };
  } catch (error) {
    console.error("Error fetching invoice items:", error);
    return { success: false, error: "Error fetching invoice items" };
  }
};

export const getInvoicePaymentMethods = async (
  invoiceId: string
): Promise<{
  success: boolean;
  data?: InvoicePaymentMethod[];
  error?: string;
}> => {
  try {
    const paymentMethods = await prisma.invoicePaymentMethod.findMany({
      where: { invoiceId },
    });

    const formattedPaymentMethods = paymentMethods.map((method) => ({
      ...method,
      term: method.term ?? undefined,
      timeUnit: method.timeUnit ?? undefined,
    }));

    return { success: true, data: formattedPaymentMethods };
  } catch (error) {
    console.error("Error fetching invoice payment methods:", error);
    return { success: false, error: "Error fetching invoice payment methods" };
  }
};

export const getInvoiceDataForPDF = async (
  invoiceId: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: {
          include: {
            sriConfig: true,
          },
        },
        customer: true,
        emissionPoint: {
          include: { establishment: true },
        },
        items: {
          include: { product: true },
        },
        taxes: true,
        paymentMethods: true,
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    const totalSinImpuestos = invoice.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const totalDescuento = invoice.items.reduce(
      (sum, item) => sum + item.discountAmount,
      0
    );

    const impuestos = invoice.taxes.map((tax) => ({
      codigo: tax.code,
      codigoPorcentaje: tax.percentage_code,
      baseImponible: tax.base,
      valor: tax.amount,
    }));

    // Aquí puedes formatear los items y métodos de pago según lo que necesites en el PDF
    const detalles = invoice.items.map((item) => ({
      codigoPrincipal: item.product.code,
      descripcion: item.product.description,
      cantidad: item.quantity,
      precioUnitario: item.unitPrice,
      descuento: item.discountAmount,
      precioTotalSinImpuesto: item.subtotal,
    }));

    const pagos = invoice.paymentMethods.map((method) => ({
      formaPago: method.paymentMethod,
      total: method.amount,
      plazo: method.term ? method.term.toString() : "0",
      unidadTiempo: method.timeUnit || "DÍAS",
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

    const importeTotal = invoice.total;

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
        logoUrl: invoice.tenant.logoUrl,
        razonSocial: invoice.tenant.name || invoice.tenant.legalName,
        ruc: invoice.tenant.ruc,
        direccionMatriz: invoice.tenant.address,
        correo: invoice.tenant.contactEmail,
        telefono: invoice.tenant.phone,
        obligadoContabilidad: invoice.tenant.obligatedAccounting ? "SI" : "NO",
        regimenRimpe: "",
      },
      infoTributaria: {
        ambiente:
          invoice.tenant.sriConfig?.sriEnvironment === "1"
            ? "PRUEBAS"
            : "PRODUCCIÓN",
        tipoEmision: "NORMAL",
        estab: invoice.emissionPoint.establishment.code,
        ptoEmi: invoice.emissionPoint.code,
        secuencial: invoice.sequential.toString().padStart(9, "0"),
        claveAcceso: invoice.accessKey,
      },
      autorizacion: {
        numeroAutorizacion: invoice.authorizationNumber || "",
        fechaAutorizacion: invoice.authorizationDate?.toISOString() || "",
      },
      comprador: {
        razonSocial: invoice.customer.name,
        identificacion: invoice.customer.identification,
        direccion: invoice.customer.address || "",
        telefono: invoice.customer.phone,
        correo: invoice.customer.email,
      },
      infoFactura: {
        fechaEmision: formatDate(invoice.issueDate.toISOString()),
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
    console.error("Error fetching invoice data for PDF:", error);
    return { success: false, error: "Error fetching invoice data for PDF" };
  }
};

export const updateInvoiceXmlFile = async (
  invoiceId: string,
  xmlFilePath: string,
  xmlFileUrl: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { xmlFilePath, xmlFileUrl },
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating XML path for invoice:", error);
    return { success: false, error: "Error updating XML path for invoice" };
  }
};
