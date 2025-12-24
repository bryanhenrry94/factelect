export const getDocumentTypeLabel = (type: string) => {
  switch (type) {
    case "INVOICE":
      return "FAC";
    case "PURCHASE":
      return "LIQCOM";
    case "CREDIT_NOTE":
      return "NC";
    case "DEBIT_NOTE":
      return "ND";
    case "WITHHOLDING":
      return "RET";
    case "REMISSION_GUIDE":
      return "GR";
    default:
      return type;
  }
};

export const getDocumentTypeLabelV2 = (type: string) => {
  switch (type) {
    case "INVOICE":
      return "Factura";
    case "PURCHASE":
      return "Liquidación de compra";
    case "CREDIT_NOTE":
      return "Nota de crédito";
    case "DEBIT_NOTE":
      return "Nota de débito";
    case "WITHHOLDING":
      return "Retención";
    case "REMISSION_GUIDE":
      return "Guía de remisión";
    default:
      return type;
  }
};
