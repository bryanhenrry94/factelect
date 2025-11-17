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
  Box,
  IconButton,
  TextField,
  Pagination,
  Typography,
} from "@mui/material";
import { Plus, Edit, Delete, Files } from "lucide-react";
import { ProductFormDialog } from "@/components/product/product-form-dialog";
import { CreateProduct, Product } from "@/lib/validations/product";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
} from "@/app/actions/product";
import { useSession } from "next-auth/react";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ProductsPage() {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  // pagination
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  /** 🔄 Cargar productos */
  const loadProducts = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    try {
      const result = await getAllProducts(tenantId);

      if (result.success) {
        setProducts(result.data || []);
        setFilteredProducts(result.data || []);
      } else {
        console.error("Error loading products:", result.error);
      }
    } catch (error) {
      console.error("Unexpected error loading products:", error);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /** 🔍 Filtro por búsqueda */
  useEffect(() => {
    const filtered = products.filter((p) =>
      `${p.code} ${p.description}`.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredProducts(filtered);
    setPage(1); // reset paginación
  }, [search, products]);

  /** Pagination slice */
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const onSubmit = async (data: CreateProduct) => {
    try {
      if (editingProduct) {
        const response = await updateProduct(editingProduct.id, data);

        if (!response.success) {
          AlertService.showError(
            `Error: ${response.error}` || "Error al actualizar el producto"
          );
          return;
        }

        AlertService.showSuccess("Producto actualizado correctamente");
      } else {
        const response = await createProduct(data, tenantId);

        if (!response.success) {
          AlertService.showError(
            `Error: ${response.error}` || "Error al crear el producto"
          );
          return;
        }

        AlertService.showSuccess("Producto creado correctamente");
      }

      await loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
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

      const resp = await deleteProduct(id);

      if (!resp.success) {
        AlertService.showError(resp.error || "No se pudo eliminar el producto");
        return;
      }

      // Mensaje de éxito al eliminar
      AlertService.showSuccess("Producto eliminado correctamente");

      await loadProducts();

      // Si la página actual quedó vacía, retrocede una página si es necesario
      const newTotalPages = Math.ceil(
        Math.max(0, filteredProducts.length - 1) / itemsPerPage
      );
      if (page > newTotalPages && newTotalPages > 0) {
        setPage(newTotalPages);
      } else if (newTotalPages === 0) {
        setPage(1);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      AlertService.showError("Error inesperado al eliminar el producto");
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

      {/* BUSCADOR + BOTÓN */}
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
          sx={{ width: { xs: "100%", sm: "250px" } }}
        />

        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setIsDialogOpen(true)}
        >
          Agregar Producto
        </Button>
      </Box>

      {/* MODAL */}
      <ProductFormDialog
        isDialogOpen={isDialogOpen}
        handleCloseDialog={handleCloseDialog}
        editingProduct={editingProduct}
        onSubmit={onSubmit}
      />

      <Card>
        <CardContent>
          {loading ? (
            <Typography align="center" sx={{ py: 6 }}>
              Cargando productos...
            </Typography>
          ) : filteredProducts.length === 0 ? (
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
              <Typography variant="h6" gutterBottom>
                No hay productos
              </Typography>
              <Typography variant="body2">
                Agrega tu primer producto o servicio
              </Typography>
            </Box>
          ) : (
            <>
              {/* TABLA */}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Descripción
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Precio</TableCell>
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedProducts.map((product) => (
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

              {/* PAGINACIÓN */}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
