export interface PersonFilter {
  tenantId: string;
  role?: "CLIENT" | "SUPPLIER" | "SELLER";
  search?: string;
}
