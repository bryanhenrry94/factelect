"use server";

import { prisma } from "@/lib/prisma";
import { create } from "xmlbuilder2";
import { InvoiceTax } from "@/prisma/generated/prisma";
import { formatDate } from "@/utils/formatters";
import { sriDocumentTypes, sriEmissionTypes } from "@/constants/sri";
import { generateAccessKey } from "@/utils/sri";
import { identificationOptions } from "@/constants/identification";

/**
 * Genera el XML del comprobante electrónico para el SRI
 */
export async function generateXmlSRI(invoiceId: string): Promise<{
  success: boolean;
  xml?: string;
  error?: string;
}> {
  try {
    // === 1. Obtener datos de la factura y configuración SRI ===
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        person: true,
        emissionPoint: { include: { establishment: true } },
        taxes: true,
        items: { include: { product: true } },
        paymentMethods: true,
      },
    });

    if (!invoice) throw new Error("Factura no encontrada");

    const sriConfig = await prisma.sRIConfiguration.findFirst({
      where: { tenantId: invoice.tenantId },
    });

    if (!sriConfig)
      throw new Error("Configuración SRI no encontrada para el arrendatario");

    // === 2. Cálculos de totales ===
    const totalWithoutTaxes = invoice.items.reduce(
      (acc, i) => acc + i.subtotal,
      0
    );
    const totalDiscount = invoice.items.reduce(
      (acc, i) => acc + i.discountAmount,
      0
    );

    // === 3. Datos de serie y secuencial ===
    const serie1 = invoice.emissionPoint.establishment.code;
    const serie2 = invoice.emissionPoint.code;
    const sequential = String(invoice.sequential).padStart(9, "0");

    // === 4. Generar clave de acceso ===
    const accessKey = generateAccessKey(
      new Date(invoice.issueDate),
      sriDocumentTypes.INVOICE,
      invoice.tenant.ruc ?? "",
      sriConfig.sriEnvironment || "1",
      `${serie1}${serie2}`,
      sequential,
      "12345678", // TODO: generar código numérico aleatorio
      sriEmissionTypes.NORMAL
    );

    // === 5. Tipo de identificación del comprador ===
    const buyerIdType = identificationOptions.find(
      (opt) => opt.value === invoice.person.identificationType
    )?.sriCode;

    if (!buyerIdType)
      throw new Error("Tipo de identificación del comprador no válido");

    // === 6. Helper para obtener código y tarifa IVA ===
    const getTaxCode = (tax: string) => {
      const map: Record<string, { code: string; rate: string }> = {
        IVA_0: { code: "0", rate: "0" },
        IVA_5: { code: "5", rate: "5" },
        IVA_12: { code: "2", rate: "12" },
        IVA_14: { code: "3", rate: "14" },
        IVA_15: { code: "4", rate: "15" },
        EXENTO_IVA: { code: "6", rate: "0" },
      };
      return map[tax] || { code: "7", rate: "0" };
    };

    // === 7. Construcción del XML ===
    const xmlObj = {
      factura: {
        "@id": "comprobante",
        "@version": "1.1.0",
        infoTributaria: {
          ambiente: sriConfig.sriEnvironment,
          tipoEmision: "1",
          razonSocial: invoice.tenant.name,
          ruc: invoice.tenant.ruc,
          claveAcceso: accessKey,
          codDoc: sriDocumentTypes.INVOICE,
          estab: serie1,
          ptoEmi: serie2,
          secuencial: sequential,
          dirMatriz: invoice.tenant.address,
        },

        infoFactura: {
          fechaEmision: formatDate(invoice.issueDate.toString()),
          dirEstablecimiento: invoice.emissionPoint.establishment.address,
          obligadoContabilidad: "SI",
          tipoIdentificacionComprador: buyerIdType,
          razonSocialComprador: `${invoice.person.firstName} ${invoice.person.lastName}`,
          identificacionComprador: invoice.person.identification,
          totalSinImpuestos: totalWithoutTaxes.toFixed(2),
          totalDescuento: totalDiscount.toFixed(2),
          totalConImpuestos: {
            totalImpuesto: invoice.taxes.map((tax: InvoiceTax) => ({
              codigo: tax.code,
              codigoPorcentaje: tax.percentage_code,
              baseImponible: tax.base,
              valor: tax.amount,
            })),
          },
          propina: "0.00",
          importeTotal: invoice.total.toFixed(2),
          moneda: "DOLAR",
          pagos: invoice.paymentMethods.map((m) => ({
            pago: {
              formaPago: m.paymentMethod,
              total: m.amount,
              plazo: m.term || "0",
              unidadTiempo: m.timeUnit || "DÍAS",
            },
          })),
        },

        detalles: {
          detalle: invoice.items.map((item) => {
            const { code, rate } = getTaxCode(item.tax);
            const taxValue = ((item.subtotal * Number(rate)) / 100).toFixed(2);

            return {
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
                    codigoPorcentaje: code,
                    tarifa: rate,
                    baseImponible: item.subtotal.toFixed(2),
                    valor: taxValue,
                  },
                ],
              },
            };
          }),
        },
      },
    };

    // === 8. Generar XML final ===
    const xml = create(xmlObj).end({ prettyPrint: true });
    return { success: true, xml };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
