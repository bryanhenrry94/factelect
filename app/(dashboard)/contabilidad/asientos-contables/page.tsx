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
import { useRouter, useSearchParams } from "next/navigation";
import { AlertService } from "@/lib/alerts";
import { useSession } from "next-auth/react";
import { JournalEntry } from "@/lib/validations/accounting/journal_entry";
import {
  deleteJournalEntry,
  getJournalEntries,
} from "@/actions/accounting/journal-entry";
import { formatDate } from "@/utils/formatters";

export default function CentrosCostoPage() {
  const router = useRouter();
  const params = useSearchParams();

  const { data: session } = useSession();

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search); // actualiza el valor definitivo
    }, 300);

    return () => clearTimeout(handler); // limpia si sigue escribiendo
  }, [search]);

  const handleCreate = () => {
    router.push(`/contabilidad/asientos-contables/nuevo`);
  };

  const handleEdit = (journalEntry: JournalEntry) => {
    router.push(`/contabilidad/asientos-contables/${journalEntry.id}/editar`);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el asiento contable?"
    );
    if (!confirm) return;

    try {
      const result = await deleteJournalEntry(id);

      if (result.success) {
        notifyInfo("Asiento contable eliminado correctamente");
        fetchCostCenters();
      } else notifyError("Error al eliminar el asiento contable");
    } catch (error) {
      notifyError("Error al eliminar el asiento contable");
    }
  };

  const fetchCostCenters = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getJournalEntries(
        session.user.tenantId,
        debouncedSearch
      );
      if (!response.success) {
        notifyError("Error al cargar los asientos contables");
        return;
      }

      setJournalEntries(response.data || []);
    } catch (error) {
      notifyError("Error al cargar los asientos contables");
    }
  };

  useEffect(() => {
    fetchCostCenters();
  }, [session?.user?.tenantId, debouncedSearch]);

  useEffect(() => {
    updateParam("search", debouncedSearch);
  }, [debouncedSearch]);

  const updateParam = (key: string, value: string) => {
    const query = new URLSearchParams(params.toString());
    query.set(key, value);

    if (query.get("search") === "") {
      query.delete("search");
    }

    router.push(`/contabilidad/asientos-contables?${query.toString()}`);
  };

  return (
    <PageContainer
      title="Asientos Contables"
      description="Gestiona los asientos contables de tu organización"
    >
      {/* Header */}
      <PageHeader title="Asientos Contables" />

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField
          label="Buscar"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            updateParam("search", e.target.value);
          }}
        />
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={handleCreate}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Nuevo
        </Button>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          {journalEntries.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay asientos contables aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega el primer asiento contable para comenzar a organizar tus
                finanzas.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Código</strong>
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
                  {journalEntries
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((journalEntry) => (
                      <TableRow key={journalEntry.id} hover>
                        <TableCell>
                          {formatDate(journalEntry.date.toString())}
                        </TableCell>
                        <TableCell>{journalEntry.description}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(journalEntry)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(journalEntry.id)}
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
                color="primary"
                count={journalEntries.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5]}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
