"use client";

import { useEffect, useState } from "react";
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
} from "@/lib/validations/inventory/product";
import { taxOptions } from "@/constants/tax";
import { Category } from "@/lib/validations/inventory/category";
import { Unit } from "@/lib/validations/unit";
import { getAllCategories } from "@/actions/inventory/category";
import { useSession } from "next-auth/react";
import { getUnits } from "@/actions/unit";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const { data: session } = useSession();

  useEffect(() => {
    fetchCategories();
    fetchUnits();
  }, [session?.user.tenantId]);

  const fetchCategories = async () => {
    try {
      if (!session?.user.tenantId) return;
      const response = await getAllCategories(session?.user.tenantId);
      if (response.success) {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const fetchUnits = async () => {
    try {
      if (!session?.user.tenantId) return;
      const res = await getUnits(session?.user.tenantId);
      if (res.success) {
        setUnits(res.data || []);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  };

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
      type: "SERVICE",
      barcode: null,
      cost: 0,
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
            <Controller
              name="type"
              control={control}
              defaultValue={
                editingProduct?.type ? editingProduct.type : "SERVICE"
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

            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Código"
                  fullWidth
                  {...field}
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  size="small"
                />
              )}
            />

            {watch("type") === "PRODUCT" && (
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
            )}

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

            <Controller
              name="tax"
              control={control}
              defaultValue={editingProduct?.tax ? editingProduct.tax : "IVA_0"}
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

            <Controller
              name="price"
              control={control}
              defaultValue={editingProduct?.price ? editingProduct.price : 0}
              render={({ field }) => (
                <TextField
                  label="Precio"
                  type="number"
                  fullWidth
                  inputProps={{ step: "0.01", min: 0 }}
                  {...field}
                  error={!!errors.price}
                  helperText={errors.price?.message}
                  value={field.value || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    field.onChange(isNaN(value) ? 0 : value);
                  }}
                  size="small"
                />
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
                    value={field.value || 0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
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
                  {categories.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                      {name}
                    </MenuItem>
                  ))}
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
                  {units.map(({ id, name, symbol }) => (
                    <MenuItem key={id} value={id}>
                      {`${name} (${symbol})`}
                    </MenuItem>
                  ))}
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
