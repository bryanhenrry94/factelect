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
import { formatDate, toInputDate } from "@/utils/formatters";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { AlertService } from "@/lib/alerts";
import { CashBox } from "@/lib/validations/cash_box";
import { deleteCashBox, getAllCashBoxes } from "@/actions/cash-box";
import { CashBoxForm } from "@/components/cash/CashBoxForm";

export default function CashBoxPage() {
  const { data: session } = useSession();

  const { search, setSearch } = useSearchFilter();

  const [open, setOpen] = useState(false);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [cashBoxSelected, setCashBoxSelected] = useState<CashBox | null>(null);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const fetchBankTransfer = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    try {
      const response = await getAllCashBoxes(tenantId, search);

      if (!response.success) {
        notifyError("Error al cargar las cajas");
        return;
      }

      setCashBoxes(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las cajas");
    }
  };

  // Ejecuta la carga
  useEffect(() => {
    fetchBankTransfer();
  }, [session?.user?.tenantId, search]);

  const handleEdit = (m: CashBox) => {
    setCashBoxSelected(m);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar la caja?"
    );
    if (!confirm) return;

    const result = await deleteCashBox(id);

    if (result.success) {
      notifyInfo("Caja eliminada correctamente");
      fetchBankTransfer();
    } else notifyError("Error al eliminar la caja");
  };

  return (
    <PageContainer title="Caja" description="Gestiona tus cajas">
      <PageHeader title="Caja" />

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
        </Box>

        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setOpen(true)}
          size="small"
        >
          Nueva Caja
        </Button>
      </Box>

      {/* Tabla */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {cashBoxes.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay cajas aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega la primera caja
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Nombre</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Ubicación</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Fecha</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {cashBoxes
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((m) => (
                      <TableRow key={m.id} hover>
                        <TableCell>{m.name || ""}</TableCell>
                        <TableCell>{m.location || ""}</TableCell>
                        <TableCell>
                          {formatDate(toInputDate(m.createdAt))}
                        </TableCell>
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
                count={cashBoxes.length}
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
        <CashBoxForm
          onSave={() => {
            fetchBankTransfer();
            setOpen(false);
            setCashBoxSelected(null);
          }}
          onCancel={() => {
            setOpen(false);
            setCashBoxSelected(null);
          }}
          cashBoxSelected={cashBoxSelected}
        />
      </Dialog>
    </PageContainer>
  );
}
