"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

import { Wallet, Lock, Unlock } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import {
  getOpenCashSession,
  openCashSession,
  closeCashSession,
  getAllCashSessions,
} from "@/actions/cash/cash-session";
import { getAllCashBoxes } from "@/actions/cash/cash-box";
import {
  CashSession,
  CreateCashSession,
  createCashSessionSchema,
  UpdateCashSession,
  updateCashSessionSchema,
} from "@/lib/validations/cash/cash_session";
import { CashBox } from "@/lib/validations/cash/cash_box";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { notifyError, notifyInfo, notifyWarning } from "@/lib/notifications";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { getAllMovementByCashSessionId } from "@/actions/cash/cash-movement";

export default function CashSessionPage() {
  const { data: session } = useSession();

  // States
  const [openSessionDialog, setOpenSessionDialog] = useState(false);
  const [closeSessionDialog, setCloseSessionDialog] = useState(false);

  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [cashSessionsHistory, setCashSessionsHistory] = useState<CashSession[]>(
    []
  );

  const form = useForm<CreateCashSession>({
    resolver: zodResolver(createCashSessionSchema),
    defaultValues: {
      tenantId: session?.user.tenantId || "",
      cashBoxId: "",
      userId: session?.user.id || "",
      initialAmount: 0,
      closingAmount: 0,
    },
  });

  const form2 = useForm<UpdateCashSession>({
    resolver: zodResolver(updateCashSessionSchema),
    defaultValues: {
      tenantId: session?.user.tenantId || "",
      cashBoxId: "",
      userId: session?.user.id || "",
      initialAmount: 0,
      closingAmount: 0,
    },
  });

  const fetchSession = async () => {
    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;
    if (!tenantId || !userId) return;

    const result = await getOpenCashSession(tenantId, userId);
    if (result.success) {
      setCashSession(result.data || null);

      form.reset({
        tenantId: tenantId,
        cashBoxId: "",
        userId: userId,
        initialAmount: 0,
        closingAmount: 0,
      });
    }
  };

  const fetchCashBoxes = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    const result = await getAllCashBoxes(tenantId);
    if (result.success) {
      setCashBoxes(result.data || []);
    }
  };

  const fetchCashSessionHistory = async () => {
    if (!session?.user?.tenantId) return;
    const result = await getAllCashSessions(session.user.tenantId);
    if (result.success) {
      setCashSessionsHistory(result.data || []);
      setCashSessions(result.data || []);
    }
  };

  useEffect(() => {
    if (!session?.user?.tenantId) return;
    fetchCashBoxes();
    fetchSession();
    fetchCashSessionHistory();
  }, [session?.user?.tenantId]);

  const handleOpenSessionDialog = (cashBoxId: string) => {
    form.reset({
      cashBoxId,
      tenantId: session?.user.tenantId || "",
      userId: session?.user.id || "",
      initialAmount: 0,
      closingAmount: 0,
    });
    setOpenSessionDialog(true);
  };

  const handleCloseSessionDialog = async (sessionId: string) => {
    const session = cashSessions.find((s) => s.id === sessionId);
    if (!session) return;

    const res = await getAllMovementByCashSessionId(sessionId);

    const totalIn = res.success
      ? res.data
          ?.filter((m) => m.type === "IN")
          .reduce((sum, m) => sum + m.amount, 0) || 0
      : 0;
    const totalOut = res.success
      ? res.data
          ?.filter((m) => m.type === "OUT")
          .reduce((sum, m) => sum + m.amount, 0) || 0
      : 0;

    const difference =
      session.initialAmount + totalIn - (session.closingAmount || 0) - totalOut;

    form2.reset({
      id: session.id,
      tenantId: session.tenantId,
      cashBoxId: session.cashBoxId,
      userId: session.userId,
      initialAmount: session.initialAmount,
      totalIn: totalIn,
      totalOut: totalOut,
      closingAmount: session.closingAmount || 0,
      difference: difference,
    });
    setCloseSessionDialog(true);
  };

  const handleOpenCashSession = async (data: CreateCashSession) => {
    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;

    if (!tenantId || !userId) {
      notifyWarning("No se pudo identificar al usuario.");
      return;
    }

    const result = await openCashSession(
      tenantId,
      data.cashBoxId,
      userId,
      data.initialAmount
    );

    if (!result.success) {
      notifyError(result.error || "Ocurrió un error inesperado.");
      return;
    }

    if (result.success) {
      notifyInfo("Caja abierta correctamente.");
      setOpenSessionDialog(false);
      fetchSession();
      fetchCashSessionHistory();
    }
  };

  const handleCloseCashSession = async (data: UpdateCashSession) => {
    if (!cashSession) return;

    const result = await closeCashSession(
      cashSession.id,
      data.closingAmount || 0
    );

    if (!result.success) {
      notifyError(result.error || "Ocurrió un error inesperado.");
      return;
    }

    if (result.success) {
      notifyInfo("Caja cerrada correctamente.");
      setCloseSessionDialog(false);
      fetchSession();
      fetchCashSessionHistory();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return (
          <Badge variant="default" className="flex w-fit items-center gap-1">
            <Unlock className="h-3 w-3" />
            Abierta
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="secondary" className="flex w-fit items-center gap-1">
            <Lock className="h-3 w-3" />
            Cerrada
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="outline" className="flex w-fit items-center gap-1">
            <Lock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer
      title="Apertura y Cierre de Caja"
      description="Apertura y Cierre de Caja"
    >
      <Card>
        <CardHeader>
          <CardTitle>Estado de las Cajas</CardTitle>
          <CardDescription>
            Abre o cierra las cajas con una sola acción.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caja</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto apertura</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cashBoxes.map((box) => {
                const session = cashSessions.find(
                  (s) => s.cashBoxId === box.id && s.status === "OPEN"
                );

                return (
                  <TableRow key={box.id}>
                    {/* Nombre */}
                    <TableCell className="font-medium">{box.name}</TableCell>

                    {/* Estado */}
                    <TableCell>
                      {session ? (
                        <Badge
                          variant="default"
                          className="flex w-fit items-center gap-1"
                        >
                          <Unlock className="h-3 w-3" />
                          Abierta
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="flex w-fit items-center gap-1"
                        >
                          <Lock className="h-3 w-3" />
                          Cerrada
                        </Badge>
                      )}
                    </TableCell>

                    {/* Monto apertura */}
                    <TableCell>
                      {session ? `$${session.initialAmount.toFixed(2)}` : "—"}
                    </TableCell>

                    {/* Usuario */}
                    <TableCell>
                      {/* {session ? session.user?.name ?? "—" : "—"} */}—
                    </TableCell>

                    {/* Acción */}
                    <TableCell className="text-right">
                      {session ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCloseSessionDialog(session.id)}
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          Cerrar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenSessionDialog(box.id)}
                        >
                          <Wallet className="mr-2 h-4 w-4" />
                          Abrir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {!cashBoxes.length && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No hay cajas registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openSessionDialog} onOpenChange={setOpenSessionDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="space-y-1">
            <DialogTitle>Abrir Caja</DialogTitle>
            <DialogDescription>
              Inicia una nueva sesión de caja seleccionando la caja y el monto
              inicial.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleOpenCashSession)}
              className="space-y-6 pt-2"
            >
              <FieldGroup>
                <FieldSet>
                  <div className="grid gap-4">
                    {/* Caja */}
                    <FormField
                      control={form.control}
                      name="cashBoxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caja</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una caja" />
                              </SelectTrigger>
                              <SelectContent>
                                {cashBoxes.map((box) => (
                                  <SelectItem key={box.id} value={box.id}>
                                    {box.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Monto */}
                    <FormField
                      control={form.control}
                      name="initialAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto de apertura</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              onBlur={() => {
                                const n = Number(field.value);
                                field.onChange(
                                  isNaN(n) ? 0 : Number(n.toFixed(2))
                                );
                              }}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Ingresa el efectivo con el que inicia la caja.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FieldSet>
              </FieldGroup>

              {/* Footer */}
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Abriendo..." : "Abrir Caja"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={closeSessionDialog} onOpenChange={setCloseSessionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cierre de Caja</DialogTitle>
            <DialogDescription>
              Revisa el resumen y registra el efectivo contado para cerrar la
              caja.
            </DialogDescription>
          </DialogHeader>

          <Form {...form2}>
            <form
              onSubmit={form2.handleSubmit(handleCloseCashSession)}
              className="space-y-6 pt-2"
            >
              {/* ===================== */}
              {/* Resumen de caja */}
              {/* ===================== */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Resumen de la sesión
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  {/* Apertura */}
                  <FormField
                    control={form2.control}
                    name="initialAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Apertura</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            disabled
                            className="bg-muted text-right"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Ingresos */}
                  <FormField
                    control={form2.control}
                    name="totalIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Ingresos</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            disabled
                            className="bg-muted text-right"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Egresos */}
                  <FormField
                    control={form2.control}
                    name="totalOut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Egresos</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            disabled
                            className="bg-muted text-right"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ===================== */}
              {/* Conteo físico */}
              {/* ===================== */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Conteo físico de efectivo
                </h4>

                {/* Monto de cierre (editable) */}
                <FormField
                  control={form2.control}
                  name="closingAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto de cierre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          inputMode="decimal"
                          placeholder="0.00"
                          className="text-lg font-semibold border-primary"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          onBlur={() => {
                            const n = Number(field.value);
                            const closing = isNaN(n) ? 0 : Number(n.toFixed(2));
                            field.onChange(closing);

                            const totalIn = form2.getValues("totalIn") || 0;
                            const totalOut = form2.getValues("totalOut") || 0;
                            const initial =
                              form2.getValues("initialAmount") || 0;

                            const diff =
                              initial + totalIn - (closing + totalOut);

                            form2.setValue(
                              "difference",
                              Number(diff.toFixed(2))
                            );
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Ingresa el efectivo contado al momento del cierre.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Diferencia */}
                <FormField
                  control={form2.control}
                  name="difference"
                  render={({ field }) => {
                    const value = Number(field.value || 0);
                    const isOk = Math.abs(value) < 0.01;

                    return (
                      <FormItem>
                        <FormLabel>Diferencia</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            type="number"
                            className={`text-right font-semibold ${
                              isOk
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Diferencia entre sistema y efectivo contado.
                        </p>
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* ===================== */}
              {/* Footer */}
              {/* ===================== */}
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={form2.formState.isSubmitting}>
                  {form2.formState.isSubmitting ? "Cerrando..." : "Cerrar Caja"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Historial */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Historial de Sesiones de Caja</CardTitle>
          <CardDescription>
            Consulta el historial de aperturas y cierres de caja realizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caja</TableHead>
                <TableHead>Fecha de Apertura</TableHead>
                <TableHead>Monto de Apertura</TableHead>
                <TableHead>Fecha de Cierre</TableHead>
                <TableHead>Monto de Cierre</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashSessionsHistory.length > 0 ? (
                cashSessionsHistory.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      {cashBoxes.find((cb) => cb.id === s.cashBoxId)?.name ||
                        "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(s.openedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>${s.initialAmount}</TableCell>
                    <TableCell>
                      {s.closedAt ? new Date(s.closedAt).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell>
                      {s.closingAmount ? `$${s.closingAmount}` : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No hay datos disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
