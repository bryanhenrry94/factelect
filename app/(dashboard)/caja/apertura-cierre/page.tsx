"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import {
  Button,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
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

  /** Fetch open session */
  const fetchSession = async () => {
    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;
    if (!tenantId || !userId) return;

    setLoading(true);
    const result = await getOpenCashSession(tenantId, userId);
    if (result.success) {
      setCashSession(result.data || null);

      // Reset valores de cierre cuando haya una sesión
      reset({
        cashBoxId: "",
        initialAmount: 0,
      });
    }

    setLoading(false);
  };

  /** Fetch cash boxes */
  const fetchCashBoxes = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    const result = await getAllCashBoxes(tenantId);
    if (result.success) {
      setCashBoxes(result.data || []);
      if (result.data?.length) {
        const firstBoxId = result.data[0].id;
        reset((prev) => ({ ...prev, boxId: firstBoxId }));
      }
    }
  };

  const fetchCashSessionHistory = async () => {
    const result = await getAllCashSessions(session!.user.tenantId);
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

  // -----------------------------
  // 🔓 ABRIR CAJA
  // -----------------------------
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

  // -----------------------------
  // 🔒 CERRAR CAJA
  // -----------------------------
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
      {/* ======================= */}
      {/*    ESTADO DE LA CAJA    */}
      {/* ======================= */}
      <Card>
        <CardContent>
          {/* ---------------------- */}
          {/* CAJA ABIERTA */}
          {/* ---------------------- */}
          {cashSession ? (
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                display="flex"
                gap={1}
                alignItems="center"
              >
                <Unlock size={20} /> Caja Abierta
              </Typography>

              <Typography mt={2}>
                Monto de apertura: <strong>${cashSession.initialAmount}</strong>
              </Typography>

              <Box mt={3}>
                <Controller
                  name="closingAmount"
                  control={control}
                  rules={{ required: "Ingrese el monto de cierre" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Monto de cierre"
                      size="small"
                      fullWidth
                      value={field.value || 0}
                      onChange={(e) => {
                        const text = e.target.value;

                        // Mantén siempre string en el campo
                        field.onChange(text);
                      }}
                      onBlur={() => {
                        const numeric = parseFloat(
                          field.value ? field.value.toString() : "0"
                        );

                        // Al salir del input conviertes a number seguro
                        field.onChange(
                          isNaN(numeric) ? 0 : Number(numeric.toFixed(2))
                        );
                      }}
                      inputProps={{ inputMode: "decimal" }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Box>

              <Button
                variant="contained"
                color="error"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleClose}
                disabled={loading}
              >
                <Lock size={18} style={{ marginRight: 6 }} /> Cerrar Caja
              </Button>
            </Box>
          ) : (
            /* ---------------------- */
            /* CAJA CERRADA */
            /* ---------------------- */
            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                display="flex"
                gap={1}
                alignItems="center"
              >
                <Lock size={20} /> Caja Cerrada
              </Typography>

              {/* Selección de Caja */}
              <Box mt={2}>
                <Controller
                  name="cashBoxId"
                  control={control}
                  rules={{ required: "Seleccione una caja" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      select
                      label="Caja"
                      size="small"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    >
                      {cashBoxes.map((box) => (
                        <MenuItem key={box.id} value={box.id}>
                          {box.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />

                {/* Monto de apertura */}
                <Controller
                  name="initialAmount"
                  control={control}
                  rules={{ required: "Ingrese el monto inicial" }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Monto de apertura"
                      size="small"
                      fullWidth
                      sx={{ mt: 2 }}
                      onChange={(e) => {
                        const text = e.target.value;

                        // Mantén siempre string en el campo
                        field.onChange(text);
                      }}
                      onBlur={() => {
                        const numeric = parseFloat(
                          field.value ? field.value.toString() : "0"
                        );

                        // Al salir del input conviertes a number seguro
                        field.onChange(
                          isNaN(numeric) ? 0 : Number(numeric.toFixed(2))
                        );
                      }}
                      inputProps={{ inputMode: "decimal" }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Box>

              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleOpen}
                disabled={loading}
              >
                <Wallet size={18} style={{ marginRight: 6 }} /> Abrir Caja
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Historial (placeholder) */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" display="flex" gap={1} alignItems="center">
            <History size={20} /> Historial
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={1}>
            Historial de aperturas y cierres.
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha de Apertura</TableCell>
                <TableCell>Monto de Apertura</TableCell>
                <TableCell>Fecha de Cierre</TableCell>
                <TableCell>Monto de Cierre</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cashSessionsHistory.length > 0 ? (
                cashSessionsHistory.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {new Date(session.openedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>${session.initialAmount}</TableCell>
                    <TableCell>
                      {session.closedAt
                        ? new Date(session.closedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {session.closingAmount
                        ? `$${session.closingAmount}`
                        : "-"}
                    </TableCell>
                    <TableCell>{session.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
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
