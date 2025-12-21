"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { CashBox } from "@/lib/validations/cash/cash_box";
import { CashSession } from "@/lib/validations/cash/cash_session";
import { CashMovement } from "@/lib/validations/cash/cash_movement";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

type FormValues = {
  cashCounts: { denomination: number; quantity: number }[];
  observations: string;
};

export const ECUADOR_DENOMINATIONS = [
  { label: "1¢", value: 0.01 },
  { label: "5¢", value: 0.05 },
  { label: "10¢", value: 0.1 },
  { label: "25¢", value: 0.25 },
  { label: "50¢", value: 0.5 },
  { label: "$1", value: 1.0 },
  { label: "$1", value: 1 },
  { label: "$5", value: 5 },
  { label: "$10", value: 10 },
  { label: "$20", value: 20 },
  { label: "$50", value: 50 },
  { label: "$100", value: 100 },
];

interface CashReconciliationFormProps {
  cashBox?: CashBox;
  session?: CashSession;
  movements: CashMovement[];
}

export const CashReconciliationForm: React.FC<CashReconciliationFormProps> = ({
  cashBox,
  session,
  movements,
}) => {
  const { control, register, watch, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      cashCounts: ECUADOR_DENOMINATIONS.map((d) => ({
        denomination: d.value,
        quantity: 0,
      })),
      observations: "",
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "cashCounts",
  });

  // ---------- Cálculos ----------
  const watchedCounts = watch("cashCounts");

  const totalContado = watchedCounts.reduce(
    (sum, item) =>
      sum + (item.denomination || 0) * (Number(item.quantity) || 0),
    0
  );

  const totalIngresos =
    movements
      ?.filter((m) => m.type === "IN")
      .reduce((s, m) => s + m.amount, 0) ?? 0;

  const totalEgresos =
    movements
      ?.filter((m) => m.type === "OUT")
      .reduce((s, m) => s + m.amount, 0) ?? 0;

  const saldoTeorico =
    (session?.initialAmount || 0) + totalIngresos - totalEgresos;

  const diferencia = totalContado - saldoTeorico;

  const onSubmit = (data: FormValues) => {
    const payload = {
      sessionId: session?.id,
      totalCounted: totalContado,
      theoreticalBalance: saldoTeorico,
      difference: diferencia,
      denominations: data.cashCounts,
      observations: data.observations,
    };

    console.log("Arqueo enviado", payload);
    // TODO: API -> create CashReconciliation + createMany(CashCount)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Arqueo de Caja</h2>
        <p className="text-sm text-muted-foreground">
          Caja: {cashBox?.name} — Sesión #{session?.id}
        </p>
      </div>

      <Separator />

      {/* Información General + Resumen */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Información */}
        <Card>
          <CardContent className="space-y-2 pt-6">
            <p className="font-semibold">Información General</p>
            <p className="text-sm">Cajero: {session?.userId}</p>
            <p className="text-sm">
              Fecha Apertura:{" "}
              {session?.openedAt
                ? new Date(session.openedAt).toLocaleString()
                : ""}
            </p>
            <p className="text-sm">Monto Inicial: ${session?.initialAmount}</p>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="md:col-span-2 grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ingresos</p>
              <p className="text-xl font-semibold">${totalIngresos}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Egresos</p>
              <p className="text-xl font-semibold">${totalEgresos}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Saldo Teórico</p>
              <p className="text-xl font-semibold">${saldoTeorico}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Conteo Físico */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Conteo Físico</h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Denominación</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const qty = watch(`cashCounts.${index}.quantity`) || 0;
              const total = qty * field.denomination;

              return (
                <TableRow key={field.id}>
                  <TableCell>${field.denomination}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      {...register(`cashCounts.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                  </TableCell>
                  <TableCell>${total.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <p className="text-lg font-semibold">
          Total Contado: ${totalContado.toFixed(2)}
        </p>
      </div>

      {/* Diferencias */}
      <div>
        {diferencia === 0 ? (
          <Alert>
            <AlertTitle>Todo correcto</AlertTitle>
            <AlertDescription>
              Todo coincide. No hay diferencias.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Diferencia detectada</AlertTitle>
            <AlertDescription>
              {diferencia > 0 ? "+" : ""}
              {diferencia.toFixed(2)}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Observaciones */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Observaciones</p>
        <Textarea
          rows={3}
          placeholder="Observaciones del arqueo..."
          {...register("observations")}
        />
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button">
          Cancelar
        </Button>
        <Button onClick={handleSubmit(onSubmit)}>Guardar Arqueo</Button>
      </div>
    </div>
  );
};
