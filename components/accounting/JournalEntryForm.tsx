"use client";

import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { Delete, Plus } from "lucide-react";

/* Actions */
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { getCostCenters } from "@/actions/accounting/cost-center";
import {
  createJournalEntry,
  updateJournalEntry,
} from "@/actions/accounting/journal-entry";

/* UI */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* Utils */
import { notifyError, notifyInfo } from "@/lib/notifications";
import { ChartOfAccount } from "@/lib/validations";
import { CostCenter } from "@/lib/validations/accounting/cost-center";
import {
  CreateJournalEntry,
  createJournalEntrySchema,
  JournalEntry,
} from "@/lib/validations/accounting/journal_entry";
import { $Enums } from "@/prisma/generated/prisma";
import { AccountSelect } from "../AccountSelected";

/* ------------------------------------------------------------------ */

const initialState: CreateJournalEntry = {
  date: new Date(),
  description: "",
  type: $Enums.EntryType.ENTRY,
  sourceType: "MANUAL_ENTRY",
  sourceId: "",
  lines: [
    { accountId: "", debit: 0, credit: 0, costCenterId: null },
    { accountId: "", debit: 0, credit: 0, costCenterId: null },
  ],
};

interface Props {
  journalEntryToEdit: JournalEntry | null;
}

export function JournalEntryForm({ journalEntryToEdit }: Props) {
  const { data: session } = useSession();

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  /* ------------------------------------------------------------------ */
  /* Fetch data */
  useEffect(() => {
    if (!session?.user?.tenantId) return;

    getAccounts(session.user.tenantId).then((r) =>
      r.success
        ? setAccounts(r.data || [])
        : notifyError("Error al cargar cuentas")
    );

    getCostCenters(session.user.tenantId).then((r) =>
      r.success
        ? setCostCenters(r.data || [])
        : notifyError("Error al cargar centros de costo")
    );
  }, [session?.user?.tenantId]);

  /* ------------------------------------------------------------------ */
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, errors },
  } = useForm<CreateJournalEntry>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: initialState,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!journalEntryToEdit) {
      reset(initialState);
      return;
    }

    reset({
      ...journalEntryToEdit,
      sourceType: journalEntryToEdit.sourceType || "MANUAL_ENTRY",
      sourceId: journalEntryToEdit.sourceId || "",
      lines: journalEntryToEdit.lines.map((l) => ({
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        costCenterId: l.costCenterId,
      })),
    });
  }, [journalEntryToEdit, reset]);

  /* ------------------------------------------------------------------ */
  const onSubmit = async (data: CreateJournalEntry) => {
    if (!session?.user?.tenantId) {
      notifyError("Tenant no encontrado");
      return;
    }

    const res = journalEntryToEdit
      ? await updateJournalEntry(journalEntryToEdit.id, data)
      : await createJournalEntry(session.user.tenantId, data);

    if (res.success) {
      notifyInfo(
        `Asiento ${journalEntryToEdit ? "actualizado" : "creado"} correctamente`
      );
      if (!journalEntryToEdit) reset(initialState);
    } else {
      notifyError(res.error || "Error al guardar asiento");
    }
  };

  /* ------------------------------------------------------------------ */
  const totalDebit = fields.reduce(
    (_, __, i) => Number(watch(`lines.${i}.debit`) || 0),
    0
  );

  const totalCredit = fields.reduce(
    (_, __, i) => Number(watch(`lines.${i}.credit`) || 0),
    0
  );

  /* ------------------------------------------------------------------ */
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* {JSON.stringify(errors)} */}
      {/* Fecha */}
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

      {/* Glosa */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Textarea {...field} placeholder="Glosa" rows={3} />
        )}
      />

      {/* Tabla */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cuenta</TableHead>
              <TableHead className="text-right">Débito</TableHead>
              <TableHead className="text-right">Crédito</TableHead>
              <TableHead>Centro de costo</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((row, index) => (
              <TableRow key={row.id}>
                {/* Cuenta */}
                <TableCell>
                  <Controller
                    name={`lines.${index}.accountId`}
                    control={control}
                    render={({ field }) => (
                      <AccountSelect
                        label="Seleccionar cuenta"
                        accounts={accounts}
                        value={field.value ?? null}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </TableCell>

                {/* Débito */}
                <TableCell>
                  <Controller
                    name={`lines.${index}.debit`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="text-right"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    )}
                  />
                </TableCell>

                {/* Crédito */}
                <TableCell>
                  <Controller
                    name={`lines.${index}.credit`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="text-right"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    )}
                  />
                </TableCell>

                {/* Centro de costo */}
                <TableCell>
                  <Controller
                    name={`lines.${index}.costCenterId`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(v) =>
                          field.onChange(v === "none" ? null : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Centro de costo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguno</SelectItem>
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

                {/* Eliminar */}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Delete className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {/* Totales */}
            <TableRow>
              <TableCell className="text-right font-semibold">
                Totales
              </TableCell>
              <TableCell className="text-right font-semibold">
                {totalDebit.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {totalCredit.toFixed(2)}
              </TableCell>
              <TableCell />
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Agregar línea */}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({ accountId: "", debit: 0, credit: 0, costCenterId: null })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar línea
      </Button>

      {/* Guardar */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
