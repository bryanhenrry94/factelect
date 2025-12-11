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
import { Controller, useForm } from "react-hook-form";
import { AlertService } from "@/lib/alerts";
import { useSession } from "next-auth/react";
import {
  CostCenter,
  CreateCostCenterInput,
  createCostCenterSchema,
} from "@/lib/validations/accounting/cost-center";
import {
  createCostCenter,
  deleteCostCenter,
  getCostCenters,
  updateCostCenter,
} from "@/actions/accounting/cost-center";

const initialState: CostCenter = {
  id: "",
  tenantId: "",
  code: "",
  name: "",
};

export default function CentrosCostoPage() {
  const router = useRouter();
  const params = useSearchParams();

  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [costCenterSelected, setCostCenterSelected] =
    useState<CostCenter | null>(null);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleClose = () => {
    setCostCenterSelected(null);
    setOpen(false);
  };

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
    reset(initialState);
    setOpen(true);
  };

  const handleEdit = (costCenter: CostCenter) => {
    setCostCenterSelected(costCenter);
    reset({
      code: costCenter.code,
      name: costCenter.name,
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el centro de costo?"
    );
    if (!confirm) return;

    try {
      const result = await deleteCostCenter(id);

      if (result.success) {
        notifyInfo("Centro de costo eliminado correctamente");
        fetchCostCenters();
      } else notifyError("Error al eliminar el centro de costo");
    } catch (error) {
      notifyError("Error al eliminar el centro de costo");
    }
  };

  const fetchCostCenters = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getCostCenters(
        session.user.tenantId,
        debouncedSearch
      );
      if (!response.success) {
        notifyError("Error al cargar las categorías");
        return;
      }

      setCostCenters(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las categorías");
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

    router.push(`/contabilidad/centros-costo?${query.toString()}`);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCostCenterInput>({
    resolver: zodResolver(createCostCenterSchema),
    defaultValues: initialState,
  });

  const onSubmit = async (data: CreateCostCenterInput) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = costCenterSelected
        ? await updateCostCenter(costCenterSelected.id, data)
        : await createCostCenter(session.user.tenantId, data);

      if (response.success) {
        await notifyInfo(
          `Cuenta ${
            costCenterSelected ? "actualizada" : "creada"
          } correctamente`
        );
        fetchCostCenters();
        handleClose();
        setCostCenterSelected(null);
      } else {
        notifyError(
          `Error al ${
            costCenterSelected ? "actualizar" : "crear"
          } el centro de costo`
        );
      }
    } catch (error) {
      console.log(error);
      notifyError("Error al guardar el centro de costo");
    }
  };

  return (
    <PageContainer
      title="Centros de Costo"
      description="Gestiona los centros de costo de tu organización"
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
          {costCenters.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay centros de costo aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega el primer centro de costo para comenzar a organizar tus
                finanzas.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Codigo</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nombre</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {costCenters
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((costCenter) => (
                      <TableRow key={costCenter.id} hover>
                        <TableCell>{costCenter.code}</TableCell>
                        <TableCell>{costCenter.name}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(costCenter)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(costCenter.id)}
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
                count={costCenters.length}
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
            {costCenterSelected ? "Editar Cuenta" : "Agregar Cuenta"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {costCenterSelected
                ? "Actualizar información de la cuenta"
                : "Agregar una nueva cuenta a tu catálogo"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Código"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    error={errors.code ? true : false}
                    helperText={errors.code?.message}
                  />
                )}
              />
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    error={errors.name ? true : false}
                    helperText={errors.name?.message}
                  />
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
                <Button variant="contained" type="submit">
                  Guardar
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </form>
      </Dialog>
    </PageContainer>
  );
}
