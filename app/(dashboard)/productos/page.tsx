"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton,
  TextField,
  TablePagination,
} from "@mui/material";
import { Plus, Edit, Delete, Files } from "lucide-react";
import { ProductFormDialog } from "@/components/product/product-form-dialog";
import { CreateProduct, Product } from "@/lib/validations/inventory/product";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
} from "@/actions/inventory/product";
import { useSession } from "next-auth/react";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const tenantId = session?.user?.tenantId || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const searchParam = params.get("search") ?? "";
  const [search, setSearch] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  /** 🔄 Cargar productos */
  const loadProducts = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    try {
      const result = await getAllProducts(tenantId, debouncedSearch);
      if (result.success) {
        setProducts(result.data || []);
      } else {
        notifyError(result.error || "Error cargando productos");
      }
    } catch (err) {
      console.error(err);
      notifyError("Error inesperado al cargar productos");
    } finally {
      setLoading(false);
    }
  }, [tenantId, debouncedSearch]);

  /** Cargar productos cuando cambie tenant o el search final */
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /** Debounce */
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  /** Actualizar query param solo cuando cambie el debounced search */
  useEffect(() => {
    const query = new URLSearchParams(params.toString());

    if (!debouncedSearch) query.delete("search");
    else query.set("search", debouncedSearch);

    router.push(`/productos?${query.toString()}`);
  }, [debouncedSearch]);

  /** Crear / actualizar producto */
  const onSubmit = async (data: CreateProduct) => {
    try {
      const action = editingProduct
        ? updateProduct(editingProduct.id, data)
        : createProduct(data, tenantId);

      const response = await action;

      if (!response.success) {
        notifyError(response.error || "Error en la operación");
        return;
      }

      notifyInfo(
        editingProduct
          ? "Producto actualizado exitosamente"
          : "Producto creado exitosamente"
      );

      await loadProducts();
    } catch (error) {
      console.error(error);
      notifyError("Error inesperado al guardar el producto");
    } finally {
      handleCloseDialog();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const confirmed = await AlertService.showConfirm(
        "¿Eliminar Producto?",
        "¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.",
        "Eliminar",
        "Cancelar"
      );

      if (!confirmed) return;

      const response = await deleteProduct(id);
      if (!response.success) {
        notifyError(response.error || "Error al eliminar el producto");
        return;
      }

      notifyInfo("Producto eliminado exitosamente");
      await loadProducts();
    } catch (error) {
      console.error(error);
      notifyError("Error inesperado al eliminar el producto");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  return (
    <PageContainer
      title="Productos"
      description="Gestiona tus productos y servicios"
    >
      <PageHeader title="Productos" />

      {/* Filtros */}
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
          label="Buscar productos"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setIsDialogOpen(true)}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Agregar Producto
        </Button>
      </Box>

      <ProductFormDialog
        isDialogOpen={isDialogOpen}
        handleCloseDialog={handleCloseDialog}
        editingProduct={editingProduct}
        onSubmit={onSubmit}
      />

      {/* Tabla */}
      <Card>
        <CardContent>
          {loading ? (
            <Typography align="center" sx={{ py: 6 }}>
              Cargando productos...
            </Typography>
          ) : products.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Files size={40} />
              <Typography variant="h6">No hay productos aún</Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega tu primer producto o servicio
              </Typography>
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {products
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {product.code}
                        </TableCell>
                        <TableCell>{product.description}</TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit />
                          </IconButton>

                          <IconButton
                            color="error"
                            onClick={() => handleDelete(product.id)}
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
                count={products.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPageOptions={[5]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
