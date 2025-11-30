"use server";

import { prisma } from "@/lib/prisma";
import { create } from "xmlbuilder2";
import { formatDate } from "@/utils/formatters";
import { sriDocumentTypes, sriEmissionTypes } from "@/constants/sri";
import { generateAccessKey } from "@/utils/sri";
import { identificationOptions } from "@/constants/identification";
import { DocumentTax } from "@/lib/validations";

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
    const document = await prisma.document.findUnique({
      where: { id: invoiceId },
      include: {
        tenant: true,
        person: true,
        documentFiscalInfo: {
          include: { establishment: true, emissionPoint: true },
        },
        taxes: true,
        items: { include: { product: true } },
        documentPayments: true,
      },
    });

    if (!document) throw new Error("Factura no encontrada");

    const sriConfig = await prisma.sRIConfiguration.findFirst({
      where: { tenantId: document.tenantId },
    });

    if (!sriConfig)
      throw new Error("Configuración SRI no encontrada para el arrendatario");

    // === 2. Cálculos de totales ===
    const totalWithoutTaxes = document.items.reduce(
      (acc, i) => acc + i.subtotal,
      0
    );
    const totalDiscount = document.items.reduce(
      (acc, i) => acc + i.discountAmount,
      0
    );

    // === 3. Datos de serie y secuencial ===
    const serie1 = document?.documentFiscalInfo?.establishment.code;
    const serie2 = document?.documentFiscalInfo?.emissionPoint.code;
    const sequential = String(document?.documentFiscalInfo?.sequence).padStart(
      9,
      "0"
    );

    // === 4. Generar clave de acceso ===
    const accessKey = generateAccessKey(
      new Date(document.issueDate),
      sriDocumentTypes.INVOICE,
      document.tenant.ruc ?? "",
      sriConfig.environment || "TEST",
      `${serie1}${serie2}`,
      sequential,
      "12345678", // TODO: generar código numérico aleatorio
      sriEmissionTypes.NORMAL
    );

    // === 5. Tipo de identificación del comprador ===
    const buyerIdType = identificationOptions.find(
      (opt) => opt.value === document.person.identificationType
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
          ambiente: sriConfig.environment === "TEST" ? "1" : "2",
          tipoEmision: "1",
          razonSocial: document.tenant.name,
          ruc: document.tenant.ruc,
          claveAcceso: accessKey,
          codDoc: sriDocumentTypes.INVOICE,
          estab: serie1,
          ptoEmi: serie2,
          secuencial: sequential,
          dirMatriz: document.tenant.address,
        },

        infoFactura: {
          fechaEmision: formatDate(document.issueDate.toString()),
          dirEstablecimiento:
            document.documentFiscalInfo?.establishment.address,
          obligadoContabilidad: "SI",
          tipoIdentificacionComprador: buyerIdType,
          razonSocialComprador: `${document.person.firstName} ${document.person.lastName}`,
          identificacionComprador: document.person.identification,
          totalSinImpuestos: totalWithoutTaxes.toFixed(2),
          totalDescuento: totalDiscount.toFixed(2),
          totalConImpuestos: {
            totalImpuesto: document.taxes.map((tax: DocumentTax) => ({
              codigo: tax.code,
              codigoPorcentaje: tax.percentage_code,
              baseImponible: tax.base,
              valor: tax.amount,
            })),
          },
          propina: "0.00",
          importeTotal: document.total.toFixed(2),
          moneda: "DOLAR",
          pagos: document.documentPayments.map((m) => ({
            pago: {
              formaPago: m.paymentMethod,
              total: m.amount,
              plazo: m.term || "0",
              unidadTiempo: m.termUnit || "DÍAS",
            },
          })),
        },

        detalles: {
          detalle: document.items.map((item) => {
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
