"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import { Wallet, Lock, Unlock, History } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";

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
} from "@/lib/validations/cash/cash_session";
import { CashBox } from "@/lib/validations/cash/cash_box";
import { zodResolver } from "@hookform/resolvers/zod";

export default function CashSessionPage() {
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [cashSessionsHistory, setCashSessionsHistory] = useState<CashSession[]>(
    []
  );

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCashSession>({
    resolver: zodResolver(createCashSessionSchema),
    defaultValues: {
      cashBoxId: "",
      initialAmount: 0,
      closingAmount: 0,
    },
  });

  const fetchSession = async () => {
    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;
    if (!tenantId || !userId) return;

    setLoading(true);
    const result = await getOpenCashSession(tenantId, userId);
    if (result.success) {
      setCashSession(result.data || null);
      reset({
        cashBoxId: "",
        initialAmount: 0,
        closingAmount: 0,
      });
    }
    setLoading(false);
  };

  const fetchCashBoxes = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    const result = await getAllCashBoxes(tenantId);
    if (result.success) {
      setCashBoxes(result.data || []);
      if (result.data?.length) {
        reset((prev) => ({ ...prev, cashBoxId: result.data![0].id }));
      }
    }
  };

  const fetchCashSessionHistory = async () => {
    if (!session?.user?.tenantId) return;
    const result = await getAllCashSessions(session.user.tenantId);
    if (result.success) {
      setCashSessionsHistory(result.data || []);
    }
  };

  useEffect(() => {
    if (!session?.user?.tenantId) return;
    fetchCashBoxes();
    fetchSession();
    fetchCashSessionHistory();
  }, [session?.user?.tenantId]);

  // 🔓 Abrir caja
  const handleOpen = handleSubmit(async (data) => {
    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;
    if (!tenantId || !userId) return;

    setLoading(true);
    const result = await openCashSession(
      tenantId,
      data.cashBoxId,
      userId,
      data.initialAmount
    );

    if (result.success) {
      fetchSession();
      fetchCashSessionHistory();
    }
    setLoading(false);
  });

  // 🔒 Cerrar caja
  const handleClose = handleSubmit(async (data) => {
    if (!cashSession) return;

    setLoading(true);
    const result = await closeCashSession(
      cashSession.id,
      data.closingAmount || 0
    );

    if (result.success) {
      fetchSession();
      fetchCashSessionHistory();
    }
    setLoading(false);
  });

  return (
    <PageContainer
      title="Apertura y Cierre de Caja"
      description="Apertura y Cierre de Caja"
    >
      {/* Estado de la caja */}
      <Card>
        <CardContent className="space-y-4">
          {cashSession ? (
            // =================
            // CAJA ABIERTA
            // =================
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Unlock className="h-5 w-5" /> Caja Abierta
              </h3>

              <p>
                Monto de apertura: <strong>${cashSession.initialAmount}</strong>
              </p>

              <Controller
                name="closingAmount"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Input
                      {...field}
                      type="number"
                      placeholder="Monto de cierre"
                      value={field.value || 0}
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
                    {fieldState.error && (
                      <p className="text-sm text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleClose}
                disabled={loading || isSubmitting}
              >
                <Lock className="mr-2 h-4 w-4" />
                Cerrar Caja
              </Button>
            </div>
          ) : (
            // =================
            // CAJA CERRADA
            // =================
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Lock className="h-5 w-5" /> Caja Cerrada
              </h3>

              <Controller
                name="cashBoxId"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    {fieldState.error && (
                      <p className="text-sm text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="initialAmount"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Input
                      {...field}
                      type="number"
                      placeholder="Monto de apertura"
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
                    {fieldState.error && (
                      <p className="text-sm text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Button
                className="w-full"
                onClick={handleOpen}
                disabled={loading || isSubmitting}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Abrir Caja
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      <Card className="mt-6">
        <CardContent className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <History className="h-5 w-5" /> Historial
          </h3>
          <p className="text-sm text-muted-foreground">
            Historial de aperturas y cierres.
          </p>

          <Table>
            <TableHeader>
              <TableRow>
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
                      {new Date(s.openedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>${s.initialAmount}</TableCell>
                    <TableCell>
                      {s.closedAt ? new Date(s.closedAt).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell>
                      {s.closingAmount ? `$${s.closingAmount}` : "-"}
                    </TableCell>
                    <TableCell>{s.status}</TableCell>
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
