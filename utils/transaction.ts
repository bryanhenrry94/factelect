export const TransactionTypes = [
  { value: "INCOME", label: "Cobro" },
  { value: "EXPENSE", label: "Pago" },
];

export const getTransactionTypeLabel = (type: string) => {
  const transactionType = TransactionTypes.find((t) => t.value === type);
  return transactionType ? transactionType.label : "Desconocido";
};
