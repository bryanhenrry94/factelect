export const paymentMethodsIncome = [
  { value: "CASH", label: "Efectivo", type: ["INCOME"] },
  {
    value: "TRANSFER",
    label: "Transferencia Bancaria",
    type: ["INCOME", "EXPENSE"],
  },
  { value: "CREDIT_CARD", label: "Tarjeta de Crédito", type: ["EXPENSE"] },
  { value: "PETTY_CASH", label: "Caja Chica", type: ["EXPENSE"] },
];

export const getPaymentMethodLabel = (method: string) => {
  const paymentMethod = paymentMethodsIncome.find((m) => m.value === method);
  return paymentMethod ? paymentMethod.label : "Desconocido";
};
