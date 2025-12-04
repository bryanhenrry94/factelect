import { z } from "zod";

export const chartOfAccountSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  accountType: z.enum(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"]),
  parentId: z.string().uuid().nullable().optional(),
});

export const createChartOfAccountSchema = chartOfAccountSchema.omit({
  tenantId: true,
  createdAt: true,
  balance: true,
});

export const updateChartOfAccountSchema = chartOfAccountSchema.partial().omit({
  id: true,
  tenantId: true,
  createdAt: true,
});

export type ChartOfAccount = z.infer<typeof chartOfAccountSchema>;
export type CreateChartOfAccount = z.infer<typeof createChartOfAccountSchema>;
export type UpdateChartOfAccount = z.infer<typeof updateChartOfAccountSchema>;
