"use server";
import { prisma } from "@/lib/prisma";

import { create } from "xmlbuilder2";
import { InvoiceTax } from "@/prisma/generated/prisma";
import { formatDate } from "@/utils/formatters";
import { sriDocumentTypes, sriEmissionTypes } from "@/constants/sri";
import { generateAccessKey } from "@/utils/sri";
import { identificationOptions } from "@/constants/identification";

export async function generateXmlSRI(invoiceId: string): Promise<{
  success: boolean;
  xml?: string;
  error?: string;
}> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        customer: true,
        emissionPoint: {
          include: { establishment: true },
        },
        taxes: true,
        items: {
          include: { product: true },
        },
        paymentMethods: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Obtiene parametro de configuración del sriEnvironment
    const sriConfig = await prisma.sRIConfiguration.findFirst({
      where: { tenantId: invoice.tenantId },
    });

    if (!sriConfig) {
      throw new Error("SRI configuration not found for tenant");
    }

    const totalWithoutTaxes = invoice.items.reduce((acc: number, item: any) => {
      return acc + item.subtotal;
    }, 0);

    const totalDiscount = invoice.items.reduce((acc: number, item: any) => {
      return acc + item.discount;
    }, 0);

    const serie1 = invoice.emissionPoint.establishment.code;
    const serie2 = invoice.emissionPoint.code;
    const sequential = String(invoice.sequential).padStart(9, "0");

    // Generar clave de acceso, revisar utils/sri.ts
    const accessKey = generateAccessKey(
      new Date(invoice.issueDate),
      sriDocumentTypes.INVOICE, // Tipo de documento: Factura
      invoice.tenant.ruc ?? "", // RUC - TODO: Obtener del establecimiento o configuración SRI
      sriConfig?.sriEnvironment || "1", // Ambiente: 1=Pruebas, 2=Producción
      `${serie1}${serie2}`, // Serie: TODO: Obtener del punto de emisión
      sequential, // Número secuencial
      "12345678", // Código numérico: TODO: Generar aleatoriamente
      sriEmissionTypes.NORMAL // Tipo de emisión: 1=Normal
    );

    // Mapear tipo de identificación del comprador al código SRI
    const tipoIdentificacionComprador = identificationOptions.find(
      (option) => option.value === invoice.customer.identificationType
    )?.sriCode;

    if (!tipoIdentificacionComprador) {
      throw new Error("Tipo de identificación del comprador no válido");
    }

    // Construir el objeto XML
    const xmlObj = {
      factura: {
        "@id": "comprobante",
        "@version": "1.1.0",
        infoTributaria: {
          ambiente: sriConfig.sriEnvironment,
          tipoEmision: "1", // Emisión normal
          razonSocial: invoice.tenant.name, // companyName
          ruc: invoice.tenant.ruc,
          claveAcceso: accessKey,
          codDoc: sriDocumentTypes.INVOICE,
          estab: invoice.emissionPoint.establishment.code, // establishmentCode
          ptoEmi: invoice.emissionPoint.code, // emissionPointCode
          secuencial: String(invoice.sequential).padStart(9, "0"), // sequentialNumber
          dirMatriz: invoice.tenant.address, // companyAddress
        },
        infoFactura: {
          fechaEmision: formatDate(invoice.issueDate.toString()),
          dirEstablecimiento: invoice.emissionPoint.establishment.address, // establishmentAddress
          obligadoContabilidad: "SI",
          tipoIdentificacionComprador: tipoIdentificacionComprador, // buyerIdType
          razonSocialComprador: invoice.customer.name, // buyerName
          identificacionComprador: invoice.customer.identification, // buyerId
          totalSinImpuestos: totalWithoutTaxes
            ? totalWithoutTaxes.toFixed(2)
            : "0.00",
          totalDescuento: totalDiscount ? totalDiscount.toFixed(2) : "0.00",
          totalConImpuestos: {
            totalImpuesto: invoice.taxes.map((tax: InvoiceTax) => ({
              codigo: tax.code,
              codigoPorcentaje: tax.percentage_code,
              baseImponible: tax.base,
              valor: tax.amount,
            })),
          },
          propina: "0.00",
          importeTotal: invoice.total,
          moneda: "DOLAR",
          pagos: invoice.paymentMethods.map((method: any) => ({
            pago: {
              formaPago: method.paymentMethod,
              total: method.amount,
              plazo: method.term || "0",
              unidadTiempo: method.timeUnit || "DÍAS",
            },
          })),
        },
        detalles: {
          detalle: invoice.items.map((item: any) => ({
            codigoPrincipal: item.product.code,
            descripcion: item.product.description,
            cantidad: item.quantity,
            precioUnitario: item.unitPrice,
            descuento: item.discountAmount,
            precioTotalSinImpuesto: item.subtotal,
            impuestos: {
              impuesto: [
                {
                  codigo: "2",
                  codigoPorcentaje:
                    item.tax === "IVA_0"
                      ? "0"
                      : item.tax === "IVA_5"
                      ? "2"
                      : item.tax === "IVA_12"
                      ? "3"
                      : item.tax === "IVA_14"
                      ? "4"
                      : item.tax === "IVA_15"
                      ? "5"
                      : item.tax === "EXENTO_IVA"
                      ? "6"
                      : "7",
                  tarifa:
                    item.tax === "IVA_0"
                      ? "0.00"
                      : item.tax === "IVA_5"
                      ? "5.00"
                      : item.tax === "IVA_12"
                      ? "12.00"
                      : item.tax === "IVA_14"
                      ? "14.00"
                      : item.tax === "IVA_15"
                      ? "15.00"
                      : item.tax === "EXENTO_IVA"
                      ? "0.00"
                      : "0.00",
                  baseImponible: item.subtotal,
                  valor:
                    (item.subtotal *
                      (item.tax === "IVA_0"
                        ? 0
                        : item.tax === "IVA_5"
                        ? 5
                        : item.tax === "IVA_12"
                        ? 12
                        : item.tax === "IVA_14"
                        ? 14
                        : item.tax === "IVA_15"
                        ? 15
                        : item.tax === "EXENTO_IVA"
                        ? 0
                        : 0)) /
                    100,
                },
              ],
            },
          })),
        },
      },
    };

    // Generar el XML
    const xml = create(xmlObj).end({ prettyPrint: true });
    return { success: true, xml };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
