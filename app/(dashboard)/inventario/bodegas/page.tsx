"use client";
import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
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
import { Controller, useForm } from "react-hook-form";
import { AlertService } from "@/lib/alerts";
import { useSession } from "next-auth/react";
import {
  CreateWarehouse,
  createWarehouseSchema,
  Warehouse,
} from "@/lib/validations/inventory/warehouse";
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouses,
  updateWarehouse,
} from "@/actions/inventory/warehouse";
import { CostCenter } from "@/lib/validations/accounting/cost-center";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { getCostCenters } from "@/actions/accounting/cost-center";

const initialState: Warehouse = {
  id: "",
  tenantId: "",
  name: "",
  costCenterId: null,
};

export default function BodegasPage() {
  const { data: session } = useSession();
  const { search, setSearch } = useSearchFilter();

  const [open, setOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseToEdit, setWarehouseToEdit] = useState<Warehouse | null>(
    null
  );
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleCreate = () => {
    reset(initialState);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleEdit = (account: Warehouse) => {
    setWarehouseToEdit(account);
    reset({
      name: account.name,
      costCenterId: account.costCenterId,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar la bodega?"
    );
    if (!confirm) return;

    try {
      const result = await deleteWarehouse(id);

      if (result.success) {
        notifyInfo("Cuenta eliminada correctamente");
        fetchWarehouses();
      } else notifyError("Error al eliminar la bodega");
    } catch (error) {
      notifyError("Error al eliminar la bodega");
    }
  };

  const fetchWarehouses = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getWarehouses(session.user.tenantId, search);
      if (!response.success) {
        notifyError("Error al cargar las categorías");
        return;
      }

      setWarehouses(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las categorías");
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [session?.user?.tenantId, search]);

  useEffect(() => {
    const fetchCostCenters = async () => {
      try {
        if (!session?.user?.tenantId) return;

        const response = await getCostCenters(session.user.tenantId);

        if (!response.success) {
          notifyError("Error al cargar los centros de costo");
          return;
        }

        setCostCenters(response.data || []);
      } catch (error) {
        notifyError("Error al cargar los centros de costo");
      }
    };

    fetchCostCenters();
  }, [session?.user?.tenantId]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWarehouse>({
    resolver: zodResolver(createWarehouseSchema),
    defaultValues: initialState,
  });

  const onSubmit = async (data: CreateWarehouse) => {
    try {
      console.log("Submitting data:", data);
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = warehouseToEdit
        ? await updateWarehouse(warehouseToEdit.id, data)
        : await createWarehouse(session.user.tenantId, data);

      if (response.success) {
        await notifyInfo(
          `Bodega ${warehouseToEdit ? "actualizada" : "creada"} correctamente`
        );
        fetchWarehouses();
        handleClose();
        setWarehouseToEdit(null);
      } else {
        notifyError(
          `Error al ${warehouseToEdit ? "actualizar" : "crear"} la bodega`
        );
      }
    } catch (error) {
      console.log(error);
      notifyError("Error al guardar la bodega");
    }
  };

  return (
    <PageContainer
      title="Bodegas"
      description="Gestiona las bodegas de tu organización"
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
          Agregar
        </Button>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          {warehouses.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay bodegas aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega la primera bodega para comenzar a gestionar tu
                inventario.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Nombre</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Centro de Costo</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warehouses
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((warehouse) => (
                      <TableRow key={warehouse.id} hover>
                        <TableCell>{warehouse.name}</TableCell>
                        <TableCell>
                          {costCenters.find(
                            (cc) => cc.id === warehouse.costCenterId
                          )?.name || ""}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(warehouse)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(warehouse.id)}
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
                count={warehouses.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5]}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {warehouseToEdit ? "Editar Cuenta" : "Agregar Cuenta"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {warehouseToEdit
                ? "Actualizar información de la bodega"
                : "Agregar una nueva bodega a tu catálogo"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre de la bodega"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    error={errors.name ? true : false}
                    helperText={errors.name?.message}
                  />
                )}
              />
              <Controller
                name="costCenterId"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Centro de Costo"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    error={errors.costCenterId ? true : false}
                    helperText={errors.costCenterId?.message}
                    select
                    value={field.value || ""}
                  >
                    <MenuItem value="">Sin centro de costo</MenuItem>
                    {costCenters.map((cc) => (
                      <MenuItem key={cc.id} value={cc.id}>
                        {cc.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button onClick={handleClose}>Cancelar</Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </form>
      </Dialog>
    </PageContainer>
  );
}
