const roleLabels: Record<string, string> = {
  CLIENT: "Cliente",
  SUPPLIER: "Proveedor",
  SELLER: "Vendedor",
};

export const getRoleLabel = (role: string) => {
  return roleLabels[role] || role;
};