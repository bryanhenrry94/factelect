import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  WithholdingCode,
  WithholdingCodeCreateSchema,
  WithholdingTypeEnum,
} from "@/lib/validations/withholding/withholding-code";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AccountSelect } from "../AccountSelected";
import { ChartOfAccount } from "@/lib/validations";

type WithholdingCodeCreate = z.infer<typeof WithholdingCodeCreateSchema>;

interface WithholdingCodeFormProps {
  onSubmit: (data: WithholdingCodeCreate) => void;
  onCancel?: () => void;
  defaultValues?: Partial<WithholdingCode>;
  accounts: ChartOfAccount[];
}

export const WithholdingCodeForm: React.FC<WithholdingCodeFormProps> = ({
  onSubmit,
  onCancel,
  accounts,
  defaultValues = {},
}) => {
  const form = useForm<WithholdingCodeCreate>({
    resolver: zodResolver(WithholdingCodeCreateSchema),
    defaultValues: {
      type: "IVA",
      code: "",
      description: "",
      percentage: 0,
      active: defaultValues.active ?? true,
      accountId: defaultValues.accountId ?? null,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Retención</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={"IVA"}>IVA</SelectItem>
                  <SelectItem value={"SOURCE"}>Fuente</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código SRI</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ej: 332" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Descripción del código" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Porcentaje</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="Ej: 12.00"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activo</FormLabel>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta Contable</FormLabel>
              <FormControl>
                <AccountSelect
                  label="Selecciona una cuenta"
                  accounts={accounts}
                  value={field.value ?? null}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 mt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
