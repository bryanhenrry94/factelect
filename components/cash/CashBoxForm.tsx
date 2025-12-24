"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getAccounts } from "@/actions/accounting/chart-of-account";
import { createCashBox, updateCashBox } from "@/actions/cash/cash-box";
import { notifyError, notifyInfo } from "@/lib/notifications";

import { ChartOfAccount } from "@/lib/validations";
import {
  CashBox,
  CreateCashBox,
  createCashBoxSchema,
} from "@/lib/validations/cash/cash_box";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

import { AccountSelect } from "../AccountSelected";

const initialState: CreateCashBox = {
  name: "",
  accountId: undefined,
  isActive: true,
};

interface CashBoxFormProps {
  cashBoxSelected?: CashBox | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export const CashBoxForm: React.FC<CashBoxFormProps> = ({
  cashBoxSelected,
  onSave,
  onCancel,
}) => {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  const form = useForm<CreateCashBox>({
    resolver: zodResolver(createCashBoxSchema),
    defaultValues: initialState,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  /* Cargar cuentas */
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!session?.user?.tenantId) return;

      try {
        const response = await getAccounts(session.user.tenantId);
        if (response.success && response.data) {
          setAccounts(response.data);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchAccounts();
  }, [session?.user?.tenantId]);

  /* Reset al editar */
  useEffect(() => {
    reset(cashBoxSelected || initialState);
  }, [cashBoxSelected, reset]);

  const onSubmit = async (data: CreateCashBox) => {
    if (!session?.user?.tenantId) {
      notifyError("No se encontró el tenantId del usuario");
      return;
    }

    try {
      const response = cashBoxSelected
        ? await updateCashBox(cashBoxSelected.id, data)
        : await createCashBox(session.user.tenantId, data);

      if (response.success) {
        notifyInfo(
          `Caja ${cashBoxSelected ? "actualizada" : "registrada"} correctamente`
        );
        onSave?.();
      } else {
        notifyError("Error al guardar la caja");
      }
    } catch (error) {
      notifyError("Error inesperado al guardar la caja");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DialogHeader>
          <DialogTitle>
            {cashBoxSelected ? "Editar Caja" : "Registrar Caja"}
          </DialogTitle>
          <DialogDescription>
            {cashBoxSelected
              ? "Actualiza los datos de la caja."
              : "Registra una nueva caja."}
          </DialogDescription>
        </DialogHeader>

        {/* Nombre */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la caja" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cuenta Contable */}
        <FormField
          control={control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta contable</FormLabel>
              <FormControl>
                <AccountSelect
                  label="Cuenta Contable"
                  value={field.value ?? null}
                  accounts={accounts}
                  onChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado */}
        <FormField
          control={control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>Activo</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Indica si la caja está disponible para operar.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Caja"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
