"use server";
import { prisma } from "@/lib/prisma";
import {
  CreateInvoice,
  Invoice,
  InvoiceResponse,
  UpdateInvoice,
} from "@/lib/validations/invoice";
import {
  InvoiceItem,
  InvoiceItemResponse,
} from "@/lib/validations/invoice-item";
import { InvoicePaymentMethod } from "@/lib/validations/invoice-payment-method";
import { formatDate } from "@/utils/formatters";

interface MonthlyEarningsResponse {
  currentMonth: {
    month: string;
    total: number;
  };
  previousYear: {
    month: string;
    total: number;
  };
  growthPercentage: number;
  trend: "up" | "down";
  history: { month: string; total: number }[];
}

interface YearlyBreakupResponse {
  totalCurrentYear: number;
  totalLastYear: number;
  growthPercentage: number;
  distribution: { label: string; value: number }[];
}

export const createInvoice = async (
  invoice: CreateInvoice,
  items: InvoiceItem[],
  paymentMethods: InvoicePaymentMethod[]
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Crear la factura
    const newInvoice = await prisma.invoice.create({
      data: {
        ...invoice,
      },
    });

    // Crear los items asociados a la factura
    if (newInvoice && items.length > 0) {
      const itemsData = items.map((item) => {
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
        };
      });

      await prisma.invoiceItem.createMany({
        data: itemsData,
      });
    }

    if (newInvoice && paymentMethods.length > 0) {
      const paymentMethodsData = paymentMethods.map((method) => {
        const { id, ...methodWithoutId } = method;
        return {
          ...methodWithoutId,
          invoiceId: newInvoice.id,
        };
      });

      await prisma.invoicePaymentMethod.createMany({
        data: paymentMethodsData,
      });
    }

    // guarda InvoiceTax
    if (newInvoice && items.length > 0) {
      // Mapeo de tipos de impuesto a su configuración
      const taxConfig = {
        IVA_0: { code: "2", percentage_code: "0", percentage: 0 },
        IVA_5: { code: "2", percentage_code: "6", percentage: 5 },
        IVA_15: { code: "2", percentage_code: "5", percentage: 15 },
        NO_IVA: { code: "2", percentage_code: "6", percentage: 0 },
        EXENTO_IVA: { code: "2", percentage_code: "7", percentage: 0 },
      };

      // Generar todos los datos de impuestos existentes
      const invoiceTaxes = Object.entries(taxConfig)
        .map(([taxType, { code, percentage_code, percentage }]) => {
          const filtered = items.filter((item) => item.tax === taxType);
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
  invoiceData: Partial<UpdateInvoice>,
  items: InvoiceItem[],
  paymentMethods: InvoicePaymentMethod[]
): Promise<{ success: boolean; data?: Invoice; error?: string }> => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: invoiceData,
    });

    // Eliminar items existentes
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // Crear nuevos items
    if (invoice && items.length > 0) {
      const itemsData = items.map((item) => {
        return {
          invoiceId: invoice.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          tax: item.tax,
          taxAmount: item.taxAmount,
          discountRate: item.discountRate,
          discountAmount: item.discountAmount,
          subtotal: item.subtotal,
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
    if (invoice && paymentMethods.length > 0) {
      const paymentMethodsData = paymentMethods.map((method) => {
        const { id, ...methodWithoutId } = method;
        return {
          ...methodWithoutId,
          invoiceId: invoice.id,
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
    if (invoice && items.length > 0) {
      // Mapeo de tipos de impuesto a su configuración
      const taxConfig = {
        IVA_0: { code: "2", percentage_code: "0", percentage: 0 },
        IVA_5: { code: "2", percentage_code: "6", percentage: 5 },
        IVA_15: { code: "2", percentage_code: "5", percentage: 15 },
        NO_IVA: { code: "2", percentage_code: "6", percentage: 0 },
        EXENTO_IVA: { code: "2", percentage_code: "7", percentage: 0 },
      };

      // Generar todos los datos de impuestos existentes
      const invoiceTaxes = Object.entries(taxConfig)
        .map(([taxType, { code, percentage_code, percentage }]) => {
          const filtered = items.filter((item) => item.tax === taxType);
          if (filtered.length === 0) return null;

          const base = filtered.reduce((sum, item) => sum + item.subtotal, 0);
          const amount = (base * percentage) / 100;

          return {
            invoiceId: invoice.id,
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

    // Formatear la respuesta
    const formattedInvoice: Invoice = {
      ...invoice,
      status: invoice.status as
        | "PENDING"
        | "AUTHORIZED"
        | "REJECTED"
        | "CANCELED",
    };

    return { success: true, data: formattedInvoice };
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
        client: true,
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
        | "PENDING"
        | "AUTHORIZED"
        | "REJECTED"
        | "CANCELED",
      client: {
        id: invoice.client.id,
        name: invoice.client.name,
        identification: invoice.client.identification,
        email: invoice.client.email,
        phone: invoice.client.phone,
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
        client: true,
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
        | "PENDING"
        | "AUTHORIZED"
        | "REJECTED"
        | "CANCELED",
      client: {
        id: invoice.client.id,
        name: invoice.client.name,
        identification: invoice.client.identification,
        email: invoice.client.email,
        phone: invoice.client.phone,
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
        client: true,
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
        razonSocial: invoice.tenant.legalName,
        ruc: invoice.tenant.ruc,
        direccionMatriz: invoice.tenant.address,
        correo: invoice.tenant.contactEmail,
        telefono: invoice.tenant.phone,
        obligadoContabilidad: "NO",
        regimenRimpe: "RIMPE EMPRENDEDOR",
      },
      infoTributaria: {
        ambiente:
          invoice.tenant.sriConfig?.sriEnvironment === "PRODUCTION"
            ? "PRODUCCIÓN"
            : "PRUEBAS",
        tipoEmision: "NORMAL",
        estab: invoice.emissionPoint.establishment.code,
        ptoEmi: invoice.emissionPoint.code,
        secuencial: invoice.sequential.toString().padStart(9, "0"),
        claveAcceso: invoice.accessKey,
      },
      autorizacion: {
        numeroAutorizacion:
          invoice.authorization ||
          "0000000000000000000000000000000000000000000000000",
        fechaAutorizacion: invoice.dueDate?.toISOString() || "",
      },
      comprador: {
        razonSocial: invoice.client.name,
        identificacion: invoice.client.identification,
        direccion: invoice.client.address || "",
        telefono: invoice.client.phone,
        correo: invoice.client.email,
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

export const getTotalAmountByMonth = async (
  tenantId: string,
  year: number,
  month: number
): Promise<number[]> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    console.log(
      "Fetching total amount for tenant:",
      tenantId,
      "Year:",
      year,
      "Month:",
      month
    );

    // Get all invoices for the month
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["AUTHORIZED", "PENDING"], // Only count valid invoices
        },
      },
      select: {
        issueDate: true,
        total: true,
      },
    });

    console.log("Invoices fetched for total amount by month:", invoices);

    // Helper function to get week number of month (0-based)
    const getWeekOfMonth = (date: Date): number => {
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayOfMonth = date.getDate();

      // Adjust for week starting on Monday (0 = Monday)
      const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
      const adjustedCurrentDay = dayOfMonth + adjustedFirstDay - 1;

      return Math.floor(adjustedCurrentDay / 7);
    };

    // Create array for weekly totals (up to 6 weeks possible in a month)
    const weeklyTotals = [0, 0, 0, 0, 0, 0];

    // Group invoices by week
    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.issueDate);
      const weekIndex = getWeekOfMonth(invoiceDate);

      if (weekIndex < weeklyTotals.length) {
        weeklyTotals[weekIndex] += Number(invoice.total);
      }
    });

    // Remove trailing zeros and ensure we have at least 4 weeks
    const nonZeroWeeks = weeklyTotals.findIndex(
      (total, index) =>
        index > 3 &&
        total === 0 &&
        weeklyTotals.slice(index).every((t) => t === 0)
    );

    const result =
      nonZeroWeeks > 0
        ? weeklyTotals.slice(0, nonZeroWeeks)
        : weeklyTotals.slice(0, 5);

    return result.length < 4
      ? [...result, ...new Array(4 - result.length).fill(0)]
      : result;
  } catch (error) {
    console.error("Error fetching total amount by month:", error);
    return [0, 0, 0, 0];
  }
};

export const getYearlyBreakup = async (
  tenantId: string,
  year: number
): Promise<YearlyBreakupResponse> => {
  try {
    const currentYearInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
        status: {
          in: ["AUTHORIZED", "PENDING"],
        },
      },
      select: {
        issueDate: true,
        total: true,
      },
    });

    const lastYearInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year - 1, 0, 1),
          lte: new Date(year - 1, 11, 31),
        },
        status: {
          in: ["AUTHORIZED", "PENDING"],
        },
      },
      select: {
        total: true,
      },
    });

    const monthlyTotals: { month: number; total: number }[] = Array.from(
      { length: 12 },
      (_, i) => ({ month: i + 1, total: 0 })
    );

    currentYearInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.issueDate);
      const monthIndex = invoiceDate.getMonth(); // 0-based index

      monthlyTotals[monthIndex].total += Number(invoice.total);
    });

    const totalCurrentYear = currentYearInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );
    const totalLastYear = lastYearInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const growthPercentage =
      totalLastYear > 0
        ? ((totalCurrentYear - totalLastYear) / totalLastYear) * 100
        : 0;

    const distribution = monthlyTotals.map((month, index) => ({
      label: new Date(0, index).toLocaleString("en", { month: "short" }),
      value: month.total,
    }));

    return {
      totalCurrentYear,
      totalLastYear,
      growthPercentage,
      distribution,
    };
  } catch (error) {
    return {
      totalCurrentYear: 0,
      totalLastYear: 0,
      growthPercentage: 0,
      distribution: [],
    };
  }
};

export const getMonthlyEarnings = async (
  tenantId: string,
  year: number,
  month: number
): Promise<MonthlyEarningsResponse> => {
  try {
    const currentMonthInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
        status: {
          in: ["AUTHORIZED", "PENDING"],
        },
      },
      select: {
        total: true,
      },
    });

    const previousYearInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        issueDate: {
          gte: new Date(year - 1, month - 1, 1),
          lte: new Date(year - 1, month, 0),
        },
        status: {
          in: ["AUTHORIZED", "PENDING"],
        },
      },
      select: {
        total: true,
      },
    });

    const currentMonthTotal = currentMonthInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const previousYearTotal = previousYearInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const growthPercentage =
      previousYearTotal > 0
        ? ((currentMonthTotal - previousYearTotal) / previousYearTotal) * 100
        : 0;

    const trend = growthPercentage >= 0 ? "up" : "down";

    // Generate history for the last 7 months including current month
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(year, month - 1 - i, 1);
      const monthInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          issueDate: {
            gte: new Date(date.getFullYear(), date.getMonth(), 1),
            lte: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          },
          status: {
            in: ["AUTHORIZED", "PENDING"],
          },
        },
        select: {
          total: true,
        },
      });

      const monthTotal = monthInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.total),
        0
      );

      history.push({
        month: date.toLocaleString("en", { month: "short" }),
        total: monthTotal,
      });
    }

    return {
      currentMonth: {
        month: new Date(year, month - 1).toLocaleString("en", {
          month: "long",
        }),
        total: currentMonthTotal,
      },
      previousYear: {
        month: new Date(year - 1, month - 1).toLocaleString("en", {
          month: "long",
        }),
        total: previousYearTotal,
      },
      growthPercentage: parseFloat(growthPercentage.toFixed(1)),
      trend,
      history,
    };
  } catch (error) {
    console.error("Error fetching monthly earnings:", error);
    return {
      currentMonth: { month: "", total: 0 },
      previousYear: { month: "", total: 0 },
      growthPercentage: 0,
      trend: "up",
      history: [],
    };
  }
};
