export const MovementTypes = [
  { value: "IN", label: "Ingreso" },
  { value: "OUT", label: "Egreso" },
];

export const getMovementTypeLabel = (type: string) => {
  const movementType = MovementTypes.find((mov) => mov.value === type);
  return movementType ? movementType.label : type;
};

export const MovementCategories = [
  { value: "SALE", label: "Venta" },
  { value: "PURCHASE", label: "Compra" },
  { value: "PETTY_CASH", label: "Caja Chica" },
  { value: "ADVANCE", label: "Anticipo" },
  { value: "REFUND", label: "Reembolso" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "OTHER", label: "Otro" },
];

export const getMovementCategoryLabel = (category: string) => {
  const movementCategory = MovementCategories.find(
    (cat) => cat.value === category
  );
  return movementCategory ? movementCategory.label : category;
};