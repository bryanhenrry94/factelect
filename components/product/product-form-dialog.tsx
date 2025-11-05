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
  } = useForm<CreateProduct>({
    resolver: zodResolver(createProductSchema),
    mode: "onChange",
    defaultValues: {
      code: "",
      price: 0,
      tax: editingProduct ? editingProduct.tax : "IVA_0",
      description: "",
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
    reset();
    handleCloseDialog();
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
          {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {editingProduct
              ? "Actualizar información del producto"
              : "Agregar un nuevo producto o servicio a tu catálogo"}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
            <TextField
              label="Código *"
              fullWidth
              {...register("code")}
              error={!!errors.code}
              helperText={errors.code?.message}
            />

            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={2}
              {...register("description")}
              error={!!errors.description}
              helperText={errors.description?.message}
            />

            <TextField
              label="Precio *"
              type="number"
              fullWidth
              inputProps={{ step: "0.01", min: 0 }}
              {...register("price", { valueAsNumber: true })}
              error={!!errors.price}
              helperText={errors.price?.message}
            />
            <Controller
              name="tax"
              control={control}
              defaultValue={editingProduct?.tax ? editingProduct.tax : "IVA_0"}
              render={({ field }) => (
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="IVA"
                  {...field}
                  error={!!errors.tax}
                  helperText={errors.tax?.message}
                >
                  {taxOptions.map(({ label, value, code }) => (
                    <MenuItem key={code} value={value}>
                      {label}
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
