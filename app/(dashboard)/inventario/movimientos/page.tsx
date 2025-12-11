"use client";
import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
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
import { AlertService } from "@/lib/alerts";
import { useSession } from "next-auth/react";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { useRouter } from "next/navigation";
import { InventoryMovement } from "@/lib/validations/inventory/inventory-movement";
import {
  deleteInventoryMovement,
  getInventoryMovements,
} from "@/actions/inventory/inventory-movement";
import { formatDate } from "@/utils/formatters";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { getWarehouses } from "@/actions/inventory/warehouse";

export default function MovimientosInventarioPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { search, setSearch } = useSearchFilter();

  const [invenMovements, setInvenMovements] = useState<InventoryMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleCreate = () => {
    router.push("/inventario/movimientos/crear");
  };

  const handleEdit = (account: InventoryMovement) => {
    router.push(`/inventario/movimientos/${account.id}/editar`);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el movimiento de inventario?"
    );
    if (!confirm) return;

    try {
      const result = await deleteInventoryMovement(id);

      if (result.success) {
        notifyInfo("Movimiento de inventario eliminado correctamente");
        fetchInventoryMovement();
      } else notifyError("Error al eliminar el movimiento de inventario");
    } catch (error) {
      notifyError("Error al eliminar el movimiento de inventario");
    }
  };

  const fetchInventoryMovement = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getInventoryMovements(
        session.user.tenantId,
        search
      );
      if (!response.success) {
        notifyError("Error al cargar los movimientos de inventario");
        return;
      }

      setInvenMovements(response.data || []);
    } catch (error) {
      notifyError("Error al cargar los movimientos de inventario");
    }
  };

  useEffect(() => {
    fetchInventoryMovement();
  }, [session?.user?.tenantId, search]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        if (!session?.user?.tenantId) return;

        const response = await getWarehouses(session.user.tenantId);
        if (!response.success) {
          notifyError("Error al cargar las bodegas");
          return;
        }

        setWarehouses(response.data || []);
      } catch (error) {
        notifyError("Error al cargar las bodegas");
      }
    };

    fetchWarehouses();
  }, [session?.user?.tenantId]);

  const getLabelForType = (type: string) => {
    switch (type) {
      case "IN":
        return "Ingreso";
      case "OUT":
        return "Egreso";
      case "TRANSFER":
        return "Transferencia";
      case "ADJUST":
        return "Ajuste";
      default:
        return type;
    }
  };

  return (
    <PageContainer
      title="Movimientos de Inventario"
      description="Gestiona los movimientos de inventario de tu organización"
    >
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
          onChange={(e) => setSearch(e.target.value)}
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
          {invenMovements.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay movimientos de inventario aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega el primer movimiento de inventario.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Fecha</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Bodega</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Descripción</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Tipo</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invenMovements
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((inven) => (
                      <TableRow key={inven.id} hover>
                        <TableCell>
                          {formatDate(inven.date.toString())}
                        </TableCell>
                        <TableCell>
                          {warehouses.find((wh) => wh.id === inven.warehouseId)
                            ?.name || ""}
                        </TableCell>
                        <TableCell>{inven.description}</TableCell>
                        <TableCell>{getLabelForType(inven.type)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(inven)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(inven.id)}
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
                count={invenMovements.length}
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
