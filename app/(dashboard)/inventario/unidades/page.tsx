"use client";
import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { Unit, CreateUnit, CreateUnitSchema } from "@/lib/validations/unit";
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
  createUnit,
  deleteUnit,
  getUnits,
  updateUnit,
} from "@/actions/unit";

const UnitsPage = () => {
  const router = useRouter();
  const params = useSearchParams();

  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitSelected, setUnitSelected] = useState<Unit | null>(null);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    reset({ name: "", symbol: "" });
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

  const handleEdit = (unit: Unit) => {
    setUnitSelected(unit);
    reset({
      name: unit ? unit.name : "",
      symbol: unit ? unit.symbol : "",
    });
    handleOpen();
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar la unidad?"
    );
    if (!confirm) return;

    try {
      const result = await deleteUnit(id);

      if (result.success) {
        notifyInfo("Unidad eliminada correctamente");
        fetchUnits();
      } else notifyError("Error al eliminar la unidad");
    } catch (error) {
      notifyError("Error al eliminar la unidad");
    }
  };

  const fetchUnits = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getUnits(session.user.tenantId, debouncedSearch);
      if (!response.success) {
        notifyError("Error al cargar las unidades");
        return;
      }

      setUnits(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las categorías");
    }
  };

  useEffect(() => {
    fetchUnits();
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
    router.push(`/inventario/unidades?${query.toString()}`);
  };

  const { control, handleSubmit, reset } = useForm<CreateUnit>({
    resolver: zodResolver(CreateUnitSchema),
    defaultValues: {
      name: "",
      symbol: "",
    },
  });

  const onSubmit = async (data: CreateUnit) => {
    try {
      console.log(data);

      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = unitSelected
        ? await updateUnit(unitSelected.id, data)
        : await createUnit(session.user.tenantId, data);

      if (response) {
        notifyInfo(
          `Unidad ${unitSelected ? "actualizada" : "creada"} correctamente`
        );
        fetchUnits();
        handleClose();
        setUnitSelected(null);
      } else {
        notifyError(
          `Error al ${unitSelected ? "actualizar" : "crear"} la unidad`
        );
      }
    } catch (error) {
      console.log(error);
      notifyError("Error al guardar la unidad");
    }
  };

  return (
    <PageContainer
      title="Unidades de Medida"
      description="Gestiona las unidades de medida de tus productos y servicios"
    >
      {/* Header */}
      <PageHeader title="Unidades de Medida" />

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
          label="Buscar unidades"
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
          onClick={handleOpen}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Agregar Unidad
        </Button>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          {units.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay unidades aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega la primera unidad de medida.
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
                      <strong>Abreviatura</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {units
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((unit) => (
                      <TableRow key={unit.id} hover>
                        <TableCell>{unit.name}</TableCell>
                        <TableCell>{unit.symbol}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(unit)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(unit.id)}
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
                count={units.length}
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
            {unitSelected ? "Editar Unidad" : "Agregar Unidad"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {unitSelected
                ? "Actualizar información de la unidad"
                : "Agregar una nueva unidad a tu catálogo"}
            </Typography>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
            >
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Nombre de la Unidad"
                    variant="outlined"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="symbol"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Abreviatura"
                    variant="outlined"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
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
};

export default UnitsPage;
