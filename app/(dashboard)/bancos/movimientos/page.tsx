"use client";
import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { notifyError, notifyInfo } from "@/lib/notifications";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  BankMovement,
  BankMovementWithAccount,
} from "@/lib/validations/bank_movement";

import {
  deleteBankMovement,
  getAllBankMovements,
} from "@/app/actions/bank-movement";

import { formatCurrency, formatDate, toInputDate } from "@/utils/formatters";
import { BankMovementForm } from "@/components/bank/BankMovementForm";
import { $Enums } from "@/prisma/generated/prisma/wasm";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { AlertService } from "@/lib/alerts";

const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const BankMovementsPage = () => {
  const { data: session } = useSession();

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter({
    defaultFrom: toInputDate(firstDayOfMonth),
    defaultTo: toInputDate(lastDayOfMonth),
  });

  const [open, setOpen] = useState(false);
  const [bankMovements, setBankMovements] = useState<BankMovementWithAccount[]>(
    []
  );
  const [bankMovementSelected, setBankMovementSelected] =
    useState<BankMovement | null>(null);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const fetchBankMovements = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    try {
      const response = await getAllBankMovements(
        tenantId,
        search,
        dateFrom,
        dateTo
      );

      if (!response.success) {
        notifyError("Error al cargar los movimientos");
        return;
      }

      setBankMovements(response.data || []);
    } catch (error) {
      notifyError("Error al cargar los movimientos");
    }
  };

  // Ejecuta la carga
  useEffect(() => {
    fetchBankMovements();
  }, [session?.user?.tenantId, search, dateFrom, dateTo]);

  const handleEdit = (m: BankMovement) => {
    setBankMovementSelected(m);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el movimiento?"
    );
    if (!confirm) return;

    const result = await deleteBankMovement(id);

    if (result.success) {
      notifyInfo("Movimiento eliminado correctamente");
      fetchBankMovements();
    } else notifyError("Error al eliminar el movimiento");
  };

  const getSimbol = (t: $Enums.BankMovementType) =>
    ["DEPOSIT", "TRANSFER_IN"].includes(t) ? "+" : "-";

  const getTypeMovementLabel = (t: $Enums.BankMovementType) => {
    switch (t) {
      case "DEPOSIT":
        return "Depósito";
      case "WITHDRAWAL":
        return "Retiro";
      case "TRANSFER_IN":
        return "Transferencia Entrada";
      case "TRANSFER_OUT":
        return "Transferencia Salida";
      default:
        return t;
    }
  };

  return (
    <PageContainer
      title="Movimientos Bancarios"
      description="Gestiona tus movimientos bancarios"
    >
      <PageHeader title="Movimientos Bancarios" />

      {/* Filtros */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ flexGrow: 1, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Buscar"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <TextField
            label="Desde"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setOpen(true)}
          size="small"
        >
          Nuevo Movimiento
        </Button>
      </Box>

      {/* Tabla */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {bankMovements.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay movimientos aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega el primer movimiento bancario
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Cuenta</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Tipo</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Fecha</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Monto</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Referencia</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Descripción</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {bankMovements
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell>{m.account?.name}</TableCell>
                        <TableCell>{getTypeMovementLabel(m.type)}</TableCell>
                        <TableCell>{formatDate(m.date.toString())}</TableCell>
                        <TableCell>
                          {`${getSimbol(m.type)} ${formatCurrency(m.amount)}`}
                        </TableCell>
                        <TableCell>{m.reference}</TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(m)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(m.id)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={bankMovements.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5]}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <BankMovementForm
          onSave={() => {
            fetchBankMovements();
            setOpen(false);
            setBankMovementSelected(null);
          }}
          onCancel={() => {
            setOpen(false);
            setBankMovementSelected(null);
          }}
          bankMovementSelected={bankMovementSelected}
        />
      </Dialog>
    </PageContainer>
  );
};

export default BankMovementsPage;
