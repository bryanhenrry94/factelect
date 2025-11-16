export const MovementTypes = [
  { value: "IN", label: "Ingreso" },
  { value: "OUT", label: "Egreso" },
];

export const getMovementTypeLabel = (type: string) => {
  const movementType = MovementTypes.find((mov) => mov.value === type);
  return movementType ? movementType.label : type;
};
