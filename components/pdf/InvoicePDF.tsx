"use client";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Estilos optimizados
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 20,
    lineHeight: 1.3,
  },
  section: { marginBottom: 10 },
  row: { flexDirection: "row" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  grayBox: {
    backgroundColor: "#E9E9E9",
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  label: { fontWeight: "bold" },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 5,
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E9E9E9",
    padding: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#FFFFFF",
  },
  tableCell: { fontSize: 9, paddingHorizontal: 3 },
  totalRow: { flexDirection: "row" },
  totalLabel: {
    backgroundColor: "#F6F6F4",
    padding: 6,
    width: 140,
    fontSize: 10,
  },
  totalValue: {
    backgroundColor: "#E9E9E9",
    padding: 6,
    flex: 1,
    fontSize: 10,
    textAlign: "right",
  },
});

interface Impuesto {
  codigo: string;
  codigoPorcentaje: string;
  baseImponible: number;
  valor: number;
}

interface Pago {
  formaPago: string;
  total: number;
  plazo: string;
  unidadTiempo: string;
}

interface Detalle {
  codigoPrincipal: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotalSinImpuesto: number;
}

interface Total {
  label: string;
  value: number;
}

interface Factura {
  emisor: {
    logoUrl: string;
    razonSocial: string;
    ruc: string;
    direccionMatriz: string;
    correo: string;
    telefono: string;
    obligadoContabilidad: string;
    regimenRimpe: string;
  };
  infoTributaria: {
    ambiente: string;
    tipoEmision: string;
    estab: string;
    ptoEmi: string;
    secuencial: string;
    claveAcceso: string;
  };
  autorizacion: {
    numeroAutorizacion: string;
    fechaAutorizacion: string;
  };
  comprador: {
    razonSocial: string;
    identificacion: string;
    direccion: string;
    telefono: string;
    correo: string;
  };
  infoFactura: {
    fechaEmision: string;
    totalSinImpuestos: number;
    totalDescuento: number;
    impuestos: Impuesto[];
    propina: number;
    importeTotal: number;
    pagos: Pago[];
  };
  detalles: Detalle[];
  totals: Total[];
}

interface InvoicePDFProps {
  factura: Factura;
}

const formatMoney = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const InvoicePDF: React.FC<InvoicePDFProps> = ({ factura }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado */}
      <View style={[styles.rowBetween, styles.section]}>
        {/* Emisor */}
        <View style={{ width: "49%" }}>
          <Image style={styles.logo} src={factura.emisor.logoUrl} />
          <View style={styles.grayBox}>
            <Text style={styles.label}>
              Emisor: {factura.emisor.razonSocial}
            </Text>
            <Text>RUC: {factura.emisor.ruc}</Text>
            <Text>Matriz: {factura.emisor.direccionMatriz}</Text>
            <Text>Correo: {factura.emisor.correo}</Text>
            <Text>Teléfono: {factura.emisor.telefono}</Text>
            <Text>
              Obligado a llevar contabilidad:{" "}
              {factura.emisor.obligadoContabilidad}
            </Text>
            <Text style={styles.label}>{factura.emisor.regimenRimpe}</Text>
          </View>
        </View>

        {/* Información tributaria */}
        <View style={{ width: "49%" }}>
          <View style={[styles.grayBox, { marginBottom: 5 }]}>
            <Text style={styles.title}>FACTURA</Text>
            <Text style={{ textAlign: "center" }}>
              No.{factura.infoTributaria.estab}-{factura.infoTributaria.ptoEmi}-
              {factura.infoTributaria.secuencial}
            </Text>
          </View>
          <View style={styles.grayBox}>
            <Text style={styles.label}>Número de Autorización:</Text>
            <Text>{factura.autorizacion.numeroAutorizacion}</Text>
            <Text style={[styles.label, { marginTop: 5 }]}>
              Fecha y hora de Autorización:
            </Text>
            <Text>{factura.autorizacion.fechaAutorizacion}</Text>
            <Text>Ambiente: {factura.infoTributaria.ambiente}</Text>
            <Text>Emisión: {factura.infoTributaria.tipoEmision}</Text>
            <Text style={[styles.label, { marginTop: 5 }]}>
              Clave de Acceso:
            </Text>
            <Text>{factura.infoTributaria.claveAcceso}</Text>
          </View>
        </View>
      </View>

      {/* Cliente */}
      <View style={[styles.grayBox, styles.rowBetween]}>
        <View style={{ width: "49%" }}>
          <Text>
            <Text style={styles.label}>Razón Social: </Text>
            {factura.comprador.razonSocial}
          </Text>
          <Text>
            <Text style={styles.label}>Dirección: </Text>
            {factura.comprador.direccion}
          </Text>
          <Text>
            <Text style={styles.label}>Fecha Emisión: </Text>
            {factura.infoFactura.fechaEmision}
          </Text>
        </View>
        <View style={{ width: "49%" }}>
          <Text>
            <Text style={styles.label}>RUC/CI: </Text>
            {factura.comprador.identificacion}
          </Text>
          <Text>
            <Text style={styles.label}>Teléfono: </Text>
            {factura.comprador.telefono}
          </Text>
          <Text>
            <Text style={styles.label}>Correo: </Text>
            {factura.comprador.correo}
          </Text>
        </View>
      </View>

      {/* Detalle */}
      <View style={styles.section}>
        <View style={styles.tableHeader}>
          {[
            "Código",
            "Cantidad",
            "Descripción",
            "P.Unit",
            "Descuento",
            "Total",
          ].map((header, i) => (
            <Text
              key={i}
              style={[
                styles.tableCell,
                { flex: 1, fontWeight: "bold", textAlign: "center" },
              ]}
            >
              {header}
            </Text>
          ))}
        </View>
        {factura.detalles.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {item.codigoPrincipal}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
              {item.cantidad.toFixed(2)}
            </Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {item.descripcion}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
              {formatMoney(item.precioUnitario)}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
              {formatMoney(item.descuento)}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
              {formatMoney(item.precioTotalSinImpuesto)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totales y formas de pago */}
      <View style={[styles.rowBetween, styles.section]}>
        {/* Información adicional */}
        <View style={{ width: "49%" }}>
          <View style={styles.grayBox}>
            <Text style={styles.label}>Información Adicional:</Text>
            <Text>
              Por servicios de aplicaciones correspondientes a abril 2025.
            </Text>
          </View>
          <View style={styles.grayBox}>
            <Text style={styles.label}>Formas de Pago:</Text>
            {factura.infoFactura.pagos.map((pago, i) => (
              <View key={i} style={{ flexDirection: "row" }}>
                <Text style={{ width: 130 }}>{pago.formaPago}</Text>
                <Text style={{ width: 70 }}>{formatMoney(pago.total)}</Text>
                <Text>
                  {pago.plazo} {pago.unidadTiempo}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totales */}
        <View style={{ width: "49%" }}>
          {factura.totals.map((total, i) => (
            <View key={i} style={styles.totalRow}>
              <Text style={styles.totalLabel}>{total.label}:</Text>
              <Text style={styles.totalValue}>{formatMoney(total.value)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;
