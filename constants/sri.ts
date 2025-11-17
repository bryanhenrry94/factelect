export const sriUrls = {
  sandbox: {
    recepcion:
      "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
    autorizacion:
      "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
  },
  produccion: {
    recepcion:
      "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl",
    autorizacion:
      "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl",
  },
} as const;

export const sriEnvironmentOptions = [
  { value: "TEST", label: "SANDBOX" },
  { value: "PRODUCTION", label: "PRODUCCION" },
];
export const sriPaymentMethods = [
  { value: "01", label: "SIN UTILIZACION DEL SISTEMA FINANCIERO" },
  { value: "15", label: "COMPENSACIÓN DE DEUDAS" },
  { value: "16", label: "TARJETA DE DÉBITO" },
  { value: "17", label: "DINERO ELECTRÓNICO" },
  { value: "18", label: "TARJETA PREPAGO" },
  { value: "19", label: "TARJETA DE CRÉDITO" },
  { value: "20", label: "OTROS CON UTILIZACION DEL SISTEMA FINANCIERO" },
  { value: "21", label: "ENDOSO DE TÍTULOS" },
];

export const sriDocumentTypes = {
  INVOICE: "01",
  CREDIT_NOTE: "04",
  DEBIT_NOTE: "05",
} as const;

export const sriEmissionTypes = {
  NORMAL: "1",
  CONTINGENCY: "2",
  OFFLINE: "3",
} as const;
