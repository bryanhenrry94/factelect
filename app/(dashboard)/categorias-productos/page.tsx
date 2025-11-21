"use client";
import { useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory,
} from "@/app/actions/category";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { notifyError, notifyInfo } from "@/lib/notifications";
import {
  Category,
  CreateCategory,
  CreateCategorySchema,
} from "@/lib/validations/category";
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

const CategorysProductsPage = () => {
  const router = useRouter();
  const params = useSearchParams();

  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySelected, setCategorySelected] = useState<Category | null>(
    null
  );

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    reset({ name: "" });
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

  const handleEdit = (category: Category) => {
    setCategorySelected(category);
    reset({ name: category.name ? category.name : "" });
    handleOpen();
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar la categoría?"
    );
    if (!confirm) return;

    try {
      const result = await deleteCategory(id);

      if (result.success) {
        notifyInfo("Categoría eliminada correctamente");
        fetchCategories();
      } else notifyError("Error al eliminar la categoría");
    } catch (error) {
      notifyError("Error al eliminar la categoría");
    }
  };

  const fetchCategories = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getAllCategories(
        session.user.tenantId,
        debouncedSearch
      );
      if (!response.success) {
        notifyError("Error al cargar las categorías");
        return;
      }

      setCategories(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las categorías");
    }
  };

  useEffect(() => {
    fetchCategories();
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

    router.push(`/categorias-productos?${query.toString()}`);
  };

  const { control, handleSubmit, reset } = useForm<CreateCategory>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: CreateCategory) => {
    try {
      console.log(data);

      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = categorySelected
        ? await updateCategory(categorySelected.id, data)
        : await createCategory(session.user.tenantId, data);

      if (response.success) {
        await notifyInfo(
          `Categoría ${
            categorySelected ? "actualizada" : "creada"
          } correctamente`
        );
        fetchCategories();
        handleClose();
        setCategorySelected(null);
      } else {
        notifyError(
          `Error al ${categorySelected ? "actualizar" : "crear"} la categoría`
        );
      }
    } catch (error) {
      console.log(error);
      notifyError("Error al guardar la categoría");
    }
  };

  return (
    <PageContainer
      title="Categorías de Productos"
      description="Gestiona las categorías de tus productos y servicios"
    >
      {/* Header */}
      <PageHeader title="Categorías de Productos" />

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
          label="Buscar categorías"
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
          Agregar Categoría
        </Button>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          {categories.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay categorías aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega la primera categoría
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
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>{category.name}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(category.id)}
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
                count={categories.length}
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
            {categorySelected ? "Editar Categoría" : "Agregar Categoría"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {categorySelected
                ? "Actualizar información de la categoría"
                : "Agregar una nueva categoría a tu catálogo"}
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
                    label="Nombre de la Categoría"
                    variant="outlined"
                    fullWidth
                    margin="normal"
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

export default CategorysProductsPage;
