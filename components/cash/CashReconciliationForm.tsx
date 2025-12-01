"use client";

import { useForm, useFieldArray } from "react-hook-form";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { CashBox } from "@/lib/validations/cash/cash_box";
import { CashSession } from "@/lib/validations/cash/cash_session";
import { CashMovement } from "@/lib/validations/cash/cash_movement";

type FormValues = {
  cashCounts: { denomination: number; quantity: number }[];
  observations: string;
};

export const ECUADOR_DENOMINATIONS = [
  // Monedas
  { label: "1¢", value: 0.01 },
  { label: "5¢", value: 0.05 },
  { label: "10¢", value: 0.1 },
  { label: "25¢", value: 0.25 },
  { label: "50¢", value: 0.5 },
  { label: "$1", value: 1.0 },

  // Billetes
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold">
        Arqueo de Caja
      </Typography>

      <Typography variant="subtitle1" color="text.secondary">
        Caja: {cashBox?.name} — Sesión #{session?.id}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* --------------------------------------------
          Información General
      --------------------------------------------- */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography fontWeight="bold">Información General</Typography>

              <Typography variant="body2">Cajero: {session?.userId}</Typography>

              <Typography variant="body2">
                Fecha Apertura:{" "}
                {session?.openedAt
                  ? new Date(session.openedAt).toLocaleString()
                  : ""}
              </Typography>

              <Typography variant="body2">
                Monto Inicial: ${session?.initialAmount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* --------------------------------------------
          Resumen
        --------------------------------------------- */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2">Ingresos</Typography>
                  <Typography variant="h6">${totalIngresos}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2">Egresos</Typography>
                  <Typography variant="h6">${totalEgresos}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="body2">Saldo Teórico</Typography>
                  <Typography variant="h6">${saldoTeorico}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* --------------------------------------------
          Conteo Físico
      --------------------------------------------- */}
      <Typography variant="h6" mb={2}>
        Conteo Físico
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Denominación</TableCell>
            <TableCell>Cantidad</TableCell>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {fields.map((field, index) => {
            const qty = watch(`cashCounts.${index}.quantity`) || 0;
            const total = qty * field.denomination;

            return (
              <TableRow key={field.id}>
                <TableCell>${field.denomination}</TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    inputProps={{ min: 0 }}
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

      <Box mt={3}>
        <Typography variant="h6">
          Total Contado: ${totalContado.toFixed(2)}
        </Typography>
      </Box>

      {/* --------------------------------------------
          Diferencias
      --------------------------------------------- */}
      <Box mt={3}>
        {diferencia === 0 ? (
          <Alert severity="success">Todo coincide. No hay diferencias.</Alert>
        ) : (
          <Alert severity="warning">
            Diferencia detectada: {diferencia > 0 ? "+" : ""}
            {diferencia.toFixed(2)}
          </Alert>
        )}
      </Box>

      {/* --------------------------------------------
          Observaciones
      --------------------------------------------- */}
      <Box mt={4}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Observaciones"
          {...register("observations")}
        />
      </Box>

      {/* --------------------------------------------
          Acciones
      --------------------------------------------- */}
      <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
        <Button variant="outlined">Cancelar</Button>

        <Button variant="contained" onClick={handleSubmit(onSubmit)}>
          Guardar Arqueo
        </Button>
      </Box>
    </Box>
  );
};
