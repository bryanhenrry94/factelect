"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash } from "lucide-react";

/* actions */
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { getCostCenters } from "@/actions/accounting/cost-center";
import { getAllBankAccounts } from "@/actions/bank/bank-account";
import {
  createBankMovement,
  getBankMovementById,
  updateBankMovement,
} from "@/actions/bank/bank-movement";

/* ui */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* domain */
import { notifyError, notifyInfo } from "@/lib/notifications";
import { ChartOfAccount } from "@/lib/validations";
import { CostCenter } from "@/lib/validations/accounting/cost-center";
import { BankAccount } from "@/lib/validations/bank/bank_account";
import {
  BankMovement,
  BankMovementSchema,
} from "@/lib/validations/bank/bank_movement";
import { $Enums } from "@/prisma/generated/prisma";

/* -------------------------------- */

const bankMovementTypeLabels: Record<$Enums.BankMovementType, string> = {
  DEBIT: "Nota de Débito",
  CREDIT: "Nota de Crédito",
};

const initialBankMovement: BankMovement = {
  id: "",
  tenantId: "",
  bankAccountId: "",
  type: $Enums.BankMovementType.DEBIT,
  date: new Date(),
  amount: 0,
  description: "",
  reference: "",
  createdAt: new Date(),
  details: [],
};

interface Props {
  bankMovementId?: string;
}

export function BankMovementForm({ bankMovementId }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<BankMovement>({
    resolver: zodResolver(BankMovementSchema),
    defaultValues: initialBankMovement,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details",
  });

  /* -------------------- load data -------------------- */

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    getAllBankAccounts(session.user.tenantId).then(
      (r) => r.success && setBankAccounts(r.data || [])
    );
    getAccounts(session.user.tenantId).then(
      (r) => r.success && setAccounts(r.data || [])
    );
    getCostCenters(session.user.tenantId).then(
      (r) => r.success && setCostCenters(r.data || [])
    );
  }, [session?.user?.tenantId]);

  useEffect(() => {
    if (!bankMovementId) return;

    getBankMovementById(bankMovementId).then((r) => {
      if (r.success && r.data) reset(r.data);
    });
  }, [bankMovementId, reset]);

  /* -------------------- total -------------------- */

  const details = watch("details");

  const total = useMemo(() => {
    return (details || []).reduce((sum, d) => sum + Number(d?.amount || 0), 0);
  }, [details?.map((d) => d.amount).join(",")]);

  useEffect(() => {
    setValue("amount", total, { shouldDirty: true });
  }, [total, setValue]);

  /* -------------------- submit -------------------- */

  const onSubmit = async (data: BankMovement) => {
    if (!session?.user?.tenantId) return;

    const res = bankMovementId
      ? await updateBankMovement(bankMovementId, data)
      : await createBankMovement(session.user.tenantId, data);

    if (!res.success) {
      notifyError("Error al guardar");
      return;
    }

    notifyInfo("Movimiento guardado correctamente");
    router.push(`/bancos/movimientos/${res.data?.id}/editar`);
  };

  /* ==================== UI ==================== */

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold">Movimiento Bancario</h2>
          <p className="text-sm text-muted-foreground">
            {bankMovementId ? "Editar movimiento" : "Nuevo movimiento"}
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          Total:
          <span className="ml-2 text-lg font-semibold text-foreground">
            {new Intl.NumberFormat("es-EC", {
              style: "currency",
              currency: "USD",
            }).format(total)}
          </span>
        </div>
      </div>

      {/* Datos principales */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Datos generales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* type */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de movimiento" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values($Enums.BankMovementType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {bankMovementTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {/* date */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                value={field.value?.toISOString().split("T")[0]}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            )}
          />

          {/* bankAccount */}
          <Controller
            name="bankAccountId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Cuenta bancaria" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />

          {/* reference */}
          <Controller
            name="reference"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Referencia" />
            )}
          />

          {/* description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea {...field} placeholder="Descripción" />
            )}
          />
        </div>
      </div>

      {/* Detalles */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Cuenta contable</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Centro de costo</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {fields.map((f, i) => (
            <TableRow key={f.id}>
              <TableCell>
                <Controller
                  name={`details.${i}.accountId`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "__none"}
                      onValueChange={(v) =>
                        field.onChange(v === "__none" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Seleccionar</SelectItem>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.code} {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </TableCell>

              <TableCell className="text-right">
                <Controller
                  name={`details.${i}.amount`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      className="text-right font-mono"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </TableCell>

              <TableCell>
                <Controller
                  name={`details.${i}.costCenterId`}
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "__none"}
                      onValueChange={(v) =>
                        field.onChange(v === "__none" ? null : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Centro de costo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Ninguno</SelectItem>
                        {costCenters.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </TableCell>

              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          <TableRow>
            <TableCell colSpan={4}>
              <div className="flex justify-start py-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    append({ accountId: "", amount: 0, costCenterId: null })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar línea contable
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar Movimiento"}
        </Button>
      </div>
    </form>
  );
}
