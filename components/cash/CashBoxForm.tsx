"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AccountSelect } from "../AccountSelected";

const initialState: CreateCashBox = {
  name: "",
  location: "",
  accountId: undefined,
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

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCashBox>({
    resolver: zodResolver(createCashBoxSchema),
    defaultValues: initialState,
  });

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
    console.log("cashBoxSelected: ", cashBoxSelected);

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
      <div className="space-y-1">
        <Label>Nombre</Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input {...field} placeholder="Nombre de la caja" />
          )}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Ubicación */}
      <div className="space-y-1">
        <Label>Ubicación</Label>
        <Controller
          name="location"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Ubicación" />}
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      {/* Cuenta Contable */}
      <div className="space-y-1">
        <Label>Cuenta Contable</Label>
        <Controller
          name="accountId"
          control={control}
          render={({ field }) => (
            <AccountSelect
              label="Cuenta Contable"
              value={field.value ?? null}
              accounts={accounts}
              onChange={(value) => field.onChange(value)}
            />
          )}
        />
        {errors.accountId && (
          <p className="text-sm text-destructive">{errors.accountId.message}</p>
        )}
      </div>

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
  );
};
