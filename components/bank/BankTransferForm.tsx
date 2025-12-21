"use client";

import { getAllBankAccounts } from "@/actions/bank/bank-account";
import {
  createBankTransfer,
  updateBankTransfer,
} from "@/actions/bank/bank-transfer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { BankAccount } from "@/lib/validations/bank/bank_account";
import {
  BankTransfer,
  CreateBankTransfer,
  createBankTransferSchema,
} from "@/lib/validations/bank/bank_transfer";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const initialState: BankTransfer = {
  id: "",
  tenantId: "",
  fromAccountId: "",
  toAccountId: "",
  amount: 0,
  date: new Date(),
  description: "",
  reference: "",
  movementOutId: "",
  movementInId: "",
  createdAt: new Date(),
};

interface BankTransferFormProps {
  bankTransferSelected?: BankTransfer | null;
  onSave?: () => void;
  onCancel?: () => void;
}

export const BankTransferForm: React.FC<BankTransferFormProps> = ({
  bankTransferSelected,
  onSave,
  onCancel,
}) => {
  const { data: session } = useSession();
  const [bankAccounts, setBankAccounts] = React.useState<BankAccount[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CreateBankTransfer>({
    resolver: zodResolver(createBankTransferSchema),
    defaultValues: initialState,
  });

  const fromAccountId = watch("fromAccountId");

  /** Cargar cuentas bancarias */
  useEffect(() => {
    const load = async () => {
      if (!session?.user?.tenantId) return;

      const res = await getAllBankAccounts(session.user.tenantId);
      if (res.success && res.data) setBankAccounts(res.data);
    };

    load();
  }, [session?.user?.tenantId]);

  /** Cargar / resetear formulario */
  useEffect(() => {
    reset(bankTransferSelected || initialState);
  }, [bankTransferSelected, reset]);

  /** Guardar */
  const onSubmit = async (data: CreateBankTransfer) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = bankTransferSelected
        ? await updateBankTransfer(bankTransferSelected.id, data)
        : await createBankTransfer(session.user.tenantId, data);

      if (response.success) {
        notifyInfo(
          bankTransferSelected
            ? "Traspaso actualizado correctamente"
            : "Traspaso registrado correctamente"
        );
        onSave?.();
      } else {
        notifyError("Error al guardar el traspaso");
      }
    } catch (error) {
      notifyError("Error inesperado al guardar el traspaso");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle className="font-semibold">
        {bankTransferSelected
          ? "Editar Traspaso Bancario"
          : "Nuevo Traspaso Bancario"}
      </DialogTitle>

      <DialogContent className="space-y-4">
        {/* Intro */}
        <p className="text-sm text-muted-foreground">
          {bankTransferSelected
            ? "Actualiza la información del traspaso entre cuentas."
            : "Registra un movimiento de fondos entre tus cuentas bancarias."}
        </p>

        {/* Cuentas */}
        <div>
          <p className="mb-2 text-sm font-semibold">Cuentas</p>

          <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Cuenta Origen */}
            <div className="w-full sm:w-[300px] space-y-1">
              <p className="text-xs text-muted-foreground">Cuenta Origen</p>
              <Controller
                name="fromAccountId"
                control={control}
                render={({ field }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.bankName} – {acc.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.fromAccountId && (
                      <p className="text-sm text-destructive">
                        {errors.fromAccountId.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            {/* Flecha */}
            <div className="flex justify-center py-2 sm:py-0">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Cuenta Destino */}
            <div className="w-full sm:w-[300px] space-y-1">
              <p className="text-xs text-muted-foreground">Cuenta Destino</p>
              <Controller
                name="toAccountId"
                control={control}
                render={({ field }) => (
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts
                          .filter((acc) => acc.id !== fromAccountId)
                          .map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.bankName} – {acc.accountNumber}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.toAccountId && (
                      <p className="text-sm text-destructive">
                        {errors.toAccountId.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </div>

        {/* Monto */}
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <div className="space-y-1">
              <Input
                {...field}
                type="number"
                placeholder="Monto"
                value={field.value ?? 0}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={() => {
                  const numeric = parseFloat(
                    field.value ? field.value.toString() : "0"
                  );
                  field.onChange(
                    isNaN(numeric) ? 0 : Number(numeric.toFixed(2))
                  );
                }}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Fecha */}
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <div className="space-y-1">
              <Input
                type="date"
                value={
                  field.value
                    ? new Date(field.value).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            </div>
          )}
        />

        <Separator />

        {/* Botones */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Procesando..."
              : bankTransferSelected
              ? "Actualizar"
              : "Registrar Traspaso"}
          </Button>
        </div>
      </DialogContent>
    </form>
  );
};
