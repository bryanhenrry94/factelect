"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
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

const initialState: CreateCashMovement = {
  type: "IN",
  category: "OTHER",
  amount: 0,
  description: "",
  cashSessionId: "",
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

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCashMovement>({
    resolver: zodResolver(createCashMovementSchema),
    defaultValues: initialState,
  });

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

      data.cashSessionId = res.data.id;

      const response = cashMovementSelected
        ? await updateCashMovement(cashMovementSelected.id, data)
        : await createCashMovement(session.user.tenantId, data);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      {/* Tipo */}
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <div>
            <Select
              value={field.value ?? undefined}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de movimiento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Ingreso</SelectItem>
                <SelectItem value="OUT">Egreso</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>
        )}
      />

      {/* Categoría */}
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <div>
            <Select
              value={field.value ?? undefined}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "SALE",
                  "PURCHASE",
                  "PETTY_CASH",
                  "ADVANCE",
                  "REFUND",
                  "TRANSFER",
                  "OTHER",
                ].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Monto */}
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <Input
            type="number"
            placeholder="Monto"
            inputMode="decimal"
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={() => {
              const n = Number(field.value);
              field.onChange(isNaN(n) ? 0 : Number(n.toFixed(2)));
            }}
          />
        )}
      />
      {errors.amount && (
        <p className="text-sm text-destructive">{errors.amount.message}</p>
      )}

      {/* Descripción */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Textarea
            placeholder="Descripción"
            {...field}
            value={field.value ?? ""}
          />
        )}
      />
      {errors.description && (
        <p className="text-sm text-destructive">{errors.description.message}</p>
      )}

      {/* Cuenta contable */}
      <Controller
        name="accountId"
        control={control}
        render={({ field }) => (
          <div>
            <Select
              value={field.value ?? undefined}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cuenta contable" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-destructive">
                {errors.accountId.message}
              </p>
            )}
          </div>
        )}
      />

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Movimiento"}
        </Button>
      </div>
    </form>
  );
}
