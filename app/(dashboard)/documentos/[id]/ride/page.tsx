"use client";

import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import InvoicePDF from "@/components/pdf/InvoicePDF";
import { useEffect, useState } from "react";

export default function InvoicePDFPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const invoiceData = {
    emisor: {
      logoUrl: "/images/logos/logo-edehsa.png",
      razonSocial: "DAZZSOFT S.A.S.",
      ruc: "0993385366001",
      direccionMatriz: "GUAYAS / DAULE / VIA SALITRE",
      correo: "info@dazzsoft.com",
      telefono: "969437708",
      obligadoContabilidad: "NO",
      regimenRimpe: "CONTRIBUYENTE RÉGIMEN RIMPE",
    },
    infoTributaria: {
      ambiente: "PRODUCCIÓN",
      tipoEmision: "NORMAL",
      estab: "001",
      ptoEmi: "001",
      secuencial: "000000050",
      claveAcceso: "1234567890123456789012345678901234567890123456789",
    },
    autorizacion: {
      numeroAutorizacion: "9876543210",
      fechaAutorizacion: "2025-04-10T10:30:00",
    },
    comprador: {
      razonSocial: "WERNERY SAMBO",
      identificacion: "0923456789",
      direccion: "GUAYAQUIL - DAULE",
      telefono: "0998765432",
      correo: "cliente@mail.com",
    },
    infoFactura: {
      fechaEmision: "2025-04-10",
      totalSinImpuestos: 200,
      totalDescuento: 0,
      impuestos: [
        { codigo: "2", codigoPorcentaje: "2", baseImponible: 200, valor: 30 },
      ],
      propina: 0,
      importeTotal: 230,
      pagos: [
        {
          formaPago: "Transferencia",
          total: 230,
          plazo: "0",
          unidadTiempo: "días",
        },
      ],
    },
    detalles: [
      {
        codigoPrincipal: "SERV001",
        descripcion: "Desarrollo de aplicación web",
        cantidad: 1,
        precioUnitario: 200,
        descuento: 0,
        precioTotalSinImpuesto: 200,
      },
    ],
    totals: [
      { label: "Subtotal Sin Impuestos", value: 200 },
      { label: "IVA 15%", value: 30 },
      { label: "Valor Total", value: 230 },
    ],
  };

  return (
    <div style={{ height: "100vh" }}>
      <PDFViewer width="100%" height="100%">
        <InvoicePDF factura={invoiceData} />
      </PDFViewer>

      {/* Enlace de descarga */}
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <PDFDownloadLink
          document={<InvoicePDF factura={invoiceData} />}
          fileName={`factura-${invoiceData.emisor.ruc}.pdf`}
        >
          {({ loading }) => (loading ? "Generando..." : "Descargar PDF")}
        </PDFDownloadLink>
      </div>
    </div>
  );
}
