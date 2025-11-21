"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  CreateProduct,
  createProductSchema,
  Product,
} from "@/lib/validations/product";
import { taxOptions } from "@/constants/tax";

interface ProductFormDialogProps {
  isDialogOpen: boolean;
  handleCloseDialog: () => void;
  editingProduct: Product | null;
  onSubmit: (data: CreateProduct) => Promise<void> | void; // Maneja tanto crear como editar
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  isDialogOpen,
  handleCloseDialog,
  editingProduct,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    control,
    watch,
  } = useForm<CreateProduct>({
    resolver: zodResolver(createProductSchema),
    mode: "onChange",
    defaultValues: {
      code: "",
      price: 0,
      tax: editingProduct ? editingProduct.tax : "IVA_0",
      description: "",
      type: "PRODUCT",
      barcode: null,
      cost: 0,
      isInventoriable: true,
    },
  });

  // Cargar datos al editar
  useEffect(() => {
    if (editingProduct) {
      reset(editingProduct);
    } else {
      reset({
        code: "",
        price: 0,
        tax: "IVA_0",
        description: "",
      });
    }
  }, [editingProduct, reset]);

  const handleFormSubmit = async (data: CreateProduct) => {
    await onSubmit(data);
  };

  return (
    <Dialog
      open={isDialogOpen}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>
          {editingProduct ? "Editar Producto" : "Agregar Producto"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editingProduct
              ? "Actualizar información del producto"
              : "Agregar un nuevo producto o servicio a tu catálogo"}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Código"
                fullWidth
                {...register("code")}
                error={!!errors.code}
                helperText={errors.code?.message}
                size="small"
              />

              <Controller
                name="barcode"
                control={control}
                defaultValue={
                  editingProduct?.barcode ? editingProduct.barcode : ""
                }
                render={({ field }) => (
                  <TextField
                    label="Código de Barras"
                    fullWidth
                    {...field}
                    error={!!errors.barcode}
                    helperText={errors.barcode?.message}
                    size="small"
                  />
                )}
              />
            </Stack>

            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              {...register("description")}
              error={!!errors.description}
              helperText={errors.description?.message}
              size="small"
            />

            <Stack direction="row" spacing={2}>
              <Controller
                name="tax"
                control={control}
                defaultValue={
                  editingProduct?.tax ? editingProduct.tax : "IVA_0"
                }
                render={({ field }) => (
                  <TextField
                    fullWidth
                    select
                    label="IVA"
                    {...field}
                    error={!!errors.tax}
                    helperText={errors.tax?.message}
                    size="small"
                  >
                    {taxOptions.map(({ label, value, code }) => (
                      <MenuItem key={code} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label="Precio"
                type="number"
                fullWidth
                inputProps={{ step: "0.01", min: 0 }}
                {...register("price", { valueAsNumber: true })}
                error={!!errors.price}
                helperText={errors.price?.message}
                size="small"
              />
            </Stack>

            <Controller
              name="type"
              control={control}
              defaultValue={
                editingProduct?.type ? editingProduct.type : "PRODUCT"
              }
              render={({ field }) => (
                <TextField
                  fullWidth
                  select
                  label="Tipo de Ítem"
                  {...field}
                  error={!!errors.type}
                  helperText={errors.type?.message}
                  size="small"
                >
                  <MenuItem value="PRODUCT">Producto</MenuItem>
                  <MenuItem value="SERVICE">Servicio</MenuItem>
                </TextField>
              )}
            />

            {watch("type") === "PRODUCT" && (
              <Controller
                name="cost"
                control={control}
                defaultValue={editingProduct?.cost ? editingProduct.cost : 0}
                render={({ field }) => (
                  <TextField
                    label="Costo"
                    type="number"
                    fullWidth
                    inputProps={{ step: "0.01", min: 0 }}
                    {...field}
                    error={!!errors.cost}
                    helperText={errors.cost?.message}
                    size="small"
                  />
                )}
              />
            )}

            {/* categoryId */}
            <Controller
              name="categoryId"
              control={control}
              defaultValue={
                editingProduct?.categoryId ? editingProduct.categoryId : ""
              }
              render={({ field }) => (
                <TextField
                  label="Categoría"
                  fullWidth
                  {...field}
                  error={!!errors.categoryId}
                  helperText={errors.categoryId?.message}
                  size="small"
                  select
                >
                  <MenuItem value="">Sin categoría</MenuItem>
                  {/* Aquí puedes mapear las categorías disponibles */}
                </TextField>
              )}
            />

            {/* medida */}
            <Controller
              name="unitId"
              control={control}
              defaultValue={editingProduct?.unitId ? editingProduct.unitId : ""}
              render={({ field }) => (
                <TextField
                  label="Unidad de Medida"
                  fullWidth
                  {...field}
                  error={!!errors.unitId}
                  helperText={errors.unitId?.message}
                  size="small"
                  select
                >
                  <MenuItem value="">Sin unidad</MenuItem>
                  {/* Aquí puedes mapear las unidades de medida disponibles */}
                </TextField>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, mb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando..."
              : editingProduct
              ? "Actualizar"
              : "Agregar"}{" "}
            Producto
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
