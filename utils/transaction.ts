export const TransactionTypes = [
  { value: "INCOME", label: "Ingreso" },
  { value: "EXPENSE", label: "Egreso" },
];

export const getTransactionTypeLabel = (type: string) => {
  const transactionType = TransactionTypes.find((t) => t.value === type);
  return transactionType ? transactionType.label : "Desconocido";
};
