import { z } from "zod";

const acountTypes = [
  "VAT_SALES", // IVA sobre ventas (débito fiscal)
  "VAT_PURCHASES", // IVA sobre compras (crédito fiscal)
  "RETENTION_VAT", // Retención de IVA
  "RETENTION_SOURCE", // Retención en la fuente
  "CASH_DEFAULT", // Caja general
  "BANK_DEFAULT", // Banco por defecto
  "ROUNDING", // Diferencias por redondeo
] as const;

// Zod schema for AccountingSetting
export const AccountingSettingSchema = z.object({
  id: z.string().cuid(),
  tenantId: z.string(),
  key: z.enum(acountTypes),
  accountId: z.string().optional(),
});

// TypeScript type for AccountingSetting
export type AccountingSetting = z.infer<typeof AccountingSettingSchema>;

// Zod schema for creating a new AccountingSetting
export const CreateAccountingSettingSchema = AccountingSettingSchema.omit({
  id: true,
});

// TypeScript type for creating a new AccountingSetting
export type CreateAccountingSetting = z.infer<
  typeof CreateAccountingSettingSchema
>;
