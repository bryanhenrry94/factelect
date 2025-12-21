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
