export interface PersonFilter {
  tenantId: string;
  isCustomer?: boolean;
  isSupplier?: boolean;
  search?: string;
}
