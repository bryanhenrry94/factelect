"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { notifyError, notifyInfo } from "@/lib/notifications";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import {
  getAccountingSettings,
  saveAccountingSettings,
} from "@/actions/accounting/accounting-settings";

/* shadcn */
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

import { AccountSelect } from "../AccountSelected";
import { ChartOfAccount } from "@/lib/validations";

import { z } from "zod";

/* =========================
   Enum de claves contables
========================= */
export enum AccountingKey {
  VAT_SALES = "VAT_SALES",
  VAT_PURCHASES = "VAT_PURCHASES",
  RETENTION_VAT = "RETENTION_VAT",
  RETENTION_SOURCE = "RETENTION_SOURCE",
  CASH_DEFAULT = "CASH_DEFAULT",
  BANK_DEFAULT = "BANK_DEFAULT",
  ROUNDING = "ROUNDING",
}

/* =========================
   Keys con etiquetas UI
========================= */
const ACCOUNTING_KEYS = [
  { key: AccountingKey.VAT_SALES, label: "IVA sobre ventas (débito fiscal)" },
  {
    key: AccountingKey.VAT_PURCHASES,
    label: "IVA sobre compras (crédito fiscal)",
  },
  { key: AccountingKey.RETENTION_VAT, label: "Retención de IVA" },
  { key: AccountingKey.RETENTION_SOURCE, label: "Retención en la fuente" },
  { key: AccountingKey.CASH_DEFAULT, label: "Caja general" },
  { key: AccountingKey.BANK_DEFAULT, label: "Banco por defecto" },
  { key: AccountingKey.ROUNDING, label: "Diferencias por redondeo" },
] as const;

/* =========================
   Schema Zod
========================= */
const AccountingSettingItemSchema = z.object({
  key: z.nativeEnum(AccountingKey),
  accountId: z.string().optional().nullable(),
});

const AccountingSettingFormSchema = z.object({
  settings: z.array(AccountingSettingItemSchema),
});

type AccountingSettingFormValues = z.infer<typeof AccountingSettingFormSchema>;

/* =========================
   Componente
========================= */
export default function AccountingSettingForm() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const tenantId = session?.user?.tenantId;

  const form = useForm<AccountingSettingFormValues>({
    resolver: zodResolver(AccountingSettingFormSchema),
    defaultValues: {
      settings: ACCOUNTING_KEYS.map((k) => ({
        key: k.key,
        accountId: "",
      })),
    },
  });

  /* =========================
     Cargar configuración contable existente
  ========================= */
  const fetchExistingSettings = async () => {
    if (!tenantId) return;

    const res = await getAccountingSettings(tenantId);

    if (!res.success) {
      notifyError("Error al cargar configuración contable");
      return;
    }

    const existingSettings = res.data || [];
    const updatedSettings = ACCOUNTING_KEYS.map((k) => {
      const existing = existingSettings.find((s) => s.key === k.key);
      return {
        key: k.key,
        accountId: existing ? existing.accountId : "",
      };
    });

    form.reset({ settings: updatedSettings });
  };

  useEffect(() => {
    fetchExistingSettings();
  }, [tenantId]);

  /* =========================
     Cargar cuentas contables
  ========================= */
  const fetchAccounts = async () => {
    if (!tenantId) return;
    const res = await getAccounts(tenantId);
    if (!res.success) {
      notifyError("Error al cargar cuentas contables");
      return;
    }
    setAccounts(res.data || []);
  };

  useEffect(() => {
    fetchAccounts();
  }, [tenantId]);

  /* =========================
     Submit
  ========================= */
  const onSubmit = async (data: AccountingSettingFormValues) => {
    if (!tenantId) return;

    try {
      const result = await saveAccountingSettings(tenantId, data.settings);

      if (result.success) {
        notifyInfo("Configuración contable guardada correctamente");
      } else {
        notifyError(result.error || "Error al guardar configuración");
      }
    } catch (error) {
      console.error(error);
      notifyError("Ocurrió un error inesperado");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Configuración Contable</FieldLegend>
            <FieldDescription>
              Asigna una cuenta contable para cada concepto del sistema.
            </FieldDescription>

            <div className="space-y-4">
              {ACCOUNTING_KEYS.map((item, index) => (
                <FormField
                  key={item.key}
                  control={form.control}
                  name={`settings.${index}.accountId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{item.label}</FormLabel>
                      <FormControl>
                        <AccountSelect
                          label="Selecciona una cuenta"
                          value={field.value || "none"}
                          accounts={accounts}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Guardando..."
                  : "Guardar configuración"}
              </Button>
            </div>
          </FieldSet>
        </FieldGroup>
      </form>
    </Form>
  );
}
