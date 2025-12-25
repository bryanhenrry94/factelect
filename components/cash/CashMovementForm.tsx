"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getAccounts } from "@/actions/accounting/chart-of-account";
import {
  createCashMovement,
  updateCashMovement,
} from "@/actions/cash/cash-movement";
import { getOpenCashSession } from "@/actions/cash/cash-session";
import { notifyError, notifyInfo } from "@/lib/notifications";

import { ChartOfAccount } from "@/lib/validations";
import {
  CashMovement,
  CreateCashMovement,
  createCashMovementSchema,
} from "@/lib/validations/cash/cash_movement";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AccountSelect } from "../AccountSelected";

const initialState: CreateCashMovement = {
  cashSessionId: "",
  type: "IN",
  category: "OTHER",
  amount: 0,
  description: "",
  cashBoxId: "",
  accountId: null,
};

interface CashMovementFormProps {
  cashMovementSelected?: CashMovement | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export function CashMovementForm({
  cashMovementSelected,
  onSave,
  onCancel,
}: CashMovementFormProps) {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  const form = useForm<CreateCashMovement>({
    resolver: zodResolver(createCashMovementSchema),
    defaultValues: initialState,
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  /* 🔄 Cargar cuentas */
  useEffect(() => {
    if (!session?.user?.tenantId) return;

    getAccounts(session.user.tenantId).then((res) => {
      if (res.success && res.data) setAccounts(res.data);
    });
  }, [session?.user?.tenantId]);

  /* 🔄 Editar / resetear */
  useEffect(() => {
    reset(cashMovementSelected || initialState);
  }, [cashMovementSelected, reset]);

  const onSubmit = async (data: CreateCashMovement) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const res = await getOpenCashSession(
        session.user.tenantId,
        session.user.id
      );

      if (!res.success || !res.data) {
        notifyError("No hay una sesión de caja abierta");
        return;
      }

      const payload = {
        ...data,
        cashSessionId: res.data.id,
        cashBoxId: res.data.cashBoxId,
      };

      const response = cashMovementSelected
        ? await updateCashMovement(cashMovementSelected.id, payload)
        : await createCashMovement(session.user.tenantId, payload);

      if (response.success) {
        notifyInfo(
          `Movimiento ${
            cashMovementSelected ? "actualizado" : "registrado"
          } correctamente`
        );
        onSave?.();
      } else notifyError("Error al guardar el movimiento");
    } catch (error) {
      notifyError("Error inesperado al guardar el movimiento");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <DialogHeader>
          <DialogTitle>
            {cashMovementSelected
              ? "Editar Movimiento de Caja"
              : "Registrar Movimiento de Caja"}
          </DialogTitle>
          <DialogDescription>
            {cashMovementSelected
              ? "Actualiza los datos del movimiento."
              : "Registra un nuevo movimiento de caja."}
          </DialogDescription>
        </DialogHeader>

        {/* Tipo y Categoría */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de movimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">Ingreso</SelectItem>
                      <SelectItem value="OUT">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={"SALE"}>Venta</SelectItem>
                      <SelectItem value={"PURCHASE"}>Compra</SelectItem>
                      <SelectItem value={"PETTY_CASH"}>Caja chica</SelectItem>
                      <SelectItem value={"ADVANCE"}>Anticipo</SelectItem>
                      <SelectItem value={"REFUND"}>Reembolso</SelectItem>
                      <SelectItem value={"TRANSFER"}>Transferencia</SelectItem>
                      <SelectItem value={"OTHER"}>Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Monto */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  onBlur={() => {
                    const n = Number(field.value);
                    field.onChange(isNaN(n) ? 0 : Number(n.toFixed(2)));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalle del movimiento"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cuenta contable */}
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta contable</FormLabel>
              <FormControl>
                <AccountSelect
                  label="Selecciona una cuenta"
                  accounts={accounts}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar Movimiento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
