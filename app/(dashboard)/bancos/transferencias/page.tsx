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
} from "@/lib/validations/bank_transfer";
import {
  deleteBankTransfer,
  getAllBankTransfers,
} from "@/app/actions/bank-transfer";
import { BankTransferForm } from "@/components/bank/BankTransferForm";

const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const BankTransfersPage = () => {
  const { data: session } = useSession();

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter({
    defaultFrom: toInputDate(firstDayOfMonth),
    defaultTo: toInputDate(lastDayOfMonth),
  });

  const [open, setOpen] = useState(false);
  const [bankTransfers, setBankTransfers] = useState<BankTransferWithAccount[]>(
    []
  );
  const [bankTransferSelected, setBankTransferSelected] =
    useState<BankTransfer | null>(null);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const fetchBankTransfer = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    try {
      const response = await getAllBankTransfers(
        tenantId,
        search,
        dateFrom,
        dateTo
      );

      if (!response.success) {
        notifyError("Error al cargar las transferencias");
        return;
      }

      setBankTransfers(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las transferencias");
    }
  };

  // Ejecuta la carga
  useEffect(() => {
    fetchBankTransfer();
  }, [session?.user?.tenantId, search, dateFrom, dateTo]);

  const handleEdit = (m: BankTransfer) => {
    setBankTransferSelected(m);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar la transferencia?"
    );
    if (!confirm) return;

    const result = await deleteBankTransfer(id);

    if (result.success) {
      notifyInfo("Transferencia eliminada correctamente");
      fetchBankTransfer();
    } else notifyError("Error al eliminar la transferencia");
  };

  return (
    <PageContainer
      title="Transferencias Bancarias"
      description="Gestiona tus transferencias bancarias"
    >
      <PageHeader title="Transferencias Bancarias" />

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
          {bankTransfers.length === 0 ? (
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
                      <strong>Cuenta Origen</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Cuenta Destino</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Fecha</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Monto</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {bankTransfers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell>{m.fromAccount?.name || ""}</TableCell>
                        <TableCell>{m.toAccount?.name || ""}</TableCell>
                        <TableCell>{formatDate(toInputDate(m.date))}</TableCell>
                        <TableCell>{formatCurrency(m.amount)}</TableCell>
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
                count={bankTransfers.length}
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
        maxWidth="md"
        fullWidth
      >
        <BankTransferForm
          onSave={() => {
            fetchBankTransfer();
            setOpen(false);
            setBankTransferSelected(null);
          }}
          onCancel={() => {
            setOpen(false);
            setBankTransferSelected(null);
          }}
          bankTransferSelected={bankTransferSelected}
        />
      </Dialog>
    </PageContainer>
  );
};

export default BankTransfersPage;
