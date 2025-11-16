export const accountTypes = [
  { value: "BANK", label: "Banco" },
  { value: "CASH", label: "Efectivo" },
  { value: "CREDIT_CARD", label: "Tarjeta de Crédito" },
];

export const getAccountTypeLabel = (type: string) => {
  const accountType = accountTypes.find((acct) => acct.value === type);
  return accountType ? accountType.label : type;
};
