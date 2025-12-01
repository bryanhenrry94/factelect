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
import { formatCurrency, formatDate, toInputDate } from "@/utils/formatters";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { AlertService } from "@/lib/alerts";
import {
  BankTransfer,
  BankTransferWithAccount,
} from "@/lib/validations/bank/bank_transfer";
import {
  deleteBankTransfer,
  getAllBankTransfers,
} from "@/actions/bank/bank-transfer";
import { BankTransferForm } from "@/components/bank/BankTransferForm";
import {
  deleteCashMovement,
  getAllCashMovements,
} from "@/actions/cash/cash-movement";
import { CashMovement } from "@/lib/validations/cash/cash_movement";
import { CashMovementForm } from "@/components/cash/CashMovementForm";
import {
  getMovementCategoryLabel,
  getMovementTypeLabel,
} from "@/utils/movement";

const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

export default function CashBoxMovementsPage() {
  const { data: session } = useSession();

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter({
    defaultFrom: toInputDate(firstDayOfMonth),
    defaultTo: toInputDate(lastDayOfMonth),
  });

  const [open, setOpen] = useState(false);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [cashMovementSelected, setCashMovementSelected] =
    useState<CashMovement | null>(null);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const fetchCashMovements = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    try {
      const response = await getAllCashMovements(
        tenantId,
        search,
        dateFrom,
        dateTo
      );

      if (!response.success) {
        notifyError("Error al cargar las transferencias");
        return;
      }

      setCashMovements(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las transferencias");
    }
  };

  // Ejecuta la carga
  useEffect(() => {
    fetchCashMovements();
  }, [session?.user?.tenantId, search, dateFrom, dateTo]);

  const handleEdit = (m: CashMovement) => {
    setCashMovementSelected(m);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el movimiento?"
    );
    if (!confirm) return;

    const result = await deleteCashMovement(id);

    if (result.success) {
      notifyInfo("Movimiento eliminado correctamente");
      fetchCashMovements();
    } else notifyError("Error al eliminar el movimiento");
  };

  return (
    <PageContainer
      title="Movimientos de Caja"
      description="Gestiona tus movimientos de caja"
    >
      <PageHeader title="Movimientos de Caja" />

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
          Nueva Transferencia
        </Button>
      </Box>

      {/* Tabla */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {cashMovements.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay transferencias aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega la primera transferencia bancaria
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Tipo</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Categoría</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Fecha</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Monto</strong>
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
                  {cashMovements
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell>{getMovementTypeLabel(m.type)}</TableCell>
                        <TableCell>
                          {getMovementCategoryLabel(m.category)}
                        </TableCell>
                        <TableCell>
                          {formatDate(toInputDate(m.createdAt))}
                        </TableCell>
                        <TableCell>{formatCurrency(m.amount)}</TableCell>
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
                count={cashMovements.length}
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
        maxWidth="sm"
        fullWidth
      >
        <CashMovementForm
          onSave={() => {
            fetchCashMovements();
            setOpen(false);
            setCashMovementSelected(null);
          }}
          onCancel={() => {
            setOpen(false);
            setCashMovementSelected(null);
          }}
          cashMovementSelected={cashMovementSelected}
        />
      </Dialog>
    </PageContainer>
  );
}
