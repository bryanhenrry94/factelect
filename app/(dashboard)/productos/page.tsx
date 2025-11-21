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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  /** 🔄 Carga los productos del tenant actual */
  const loadProducts = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const result = await getAllProducts(tenantId);

      if (result.success) setProducts(result.data || []);
      else console.error("Error loading products:", result.error);
    } catch (err) {
      console.error("Unexpected error loading products:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onSubmit = async (data: CreateProduct) => {
    try {
      console.log("Submitting product data:", data);
      if (editingProduct) {
        const response = await updateProduct(editingProduct.id, data);

        if (!response.success) {
          AlertService.showError(
            `Error: ${response.error}` || "Error al actualizar el producto"
          );
          return;
        }
      } else {
        const response = await createProduct(data, tenantId);

        if (!response.success) {
          AlertService.showError(
            `Error: ${response.error}` || "Error al crear el producto"
          );
          return;
        }
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

      await deleteProduct(id);
      console.log(`Product ${id} deleted successfully`);
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
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
      {/* Header */}
      <PageHeader title="Productos" />

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField label="Buscar productos" variant="outlined" size="small" />
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => setIsDialogOpen(true)}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Agregar Producto
        </Button>
      </Box>

      {/* Modal */}
      <ProductFormDialog
        isDialogOpen={isDialogOpen}
        handleCloseDialog={handleCloseDialog}
        editingProduct={editingProduct}
        onSubmit={onSubmit}
      />

      {/* Tabla de productos */}
      <Card>
        <CardContent>
          {loading ? (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 6 }}
            >
              Cargando productos...
            </Typography>
          ) : products.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
                textAlign: "center",
              }}
            >
              <Files size={40} />
              <Typography variant="h6" gutterBottom>
                No hay productos aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega tu primer producto o servicio
              </Typography>
            </Box>
          ) : (
            <Box>
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
                  {products.map((product) => (
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
            </Box>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
