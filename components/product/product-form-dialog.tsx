"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Autocomplete,
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
import { ChartOfAccount } from "@/lib/validations";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { notifyError } from "@/lib/notifications";

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
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  const { data: session } = useSession();

  useEffect(() => {
    fetchCategories();
    fetchUnits();
    fetchAccounts();
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

  const fetchAccounts = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getAccounts(session.user.tenantId);
      if (!response.success) {
        notifyError("Error al cargar las cuentas contables");
        return;
      }

      setAccounts(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las cuentas contables");
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
    },
  });

  // Cargar datos al editar
  useEffect(() => {
    if (editingProduct) {
      reset(editingProduct);
    } else {
      reset({
        type: "SERVICE",
        code: "",
        price: 0,
        tax: "IVA_0",
        description: "",
        inventoryAccountId: "",
        costAccountId: "",
        categoryId: "",
        unitId: "",
        barcode: null,
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
                render={({ field }) => (
                  <TextField
                    label="Código de Barras"
                    fullWidth
                    {...field}
                    value={field.value || ""}
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
              {...register("description")}
              error={!!errors.description}
              helperText={errors.description?.message}
              size="small"
            />

            <Controller
              name="tax"
              control={control}
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

            {/* categoryId */}
            <Controller
              name="categoryId"
              control={control}
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

            <Typography variant="body2" color="text.secondary">
              {"Contabilidad"}
            </Typography>

            <Controller
              name="inventoryAccountId"
              control={control}
              render={({ field }) => {
                const selectedOption =
                  accounts.find((a) => a.id === field.value) || null;

                return (
                  <Autocomplete
                    options={accounts}
                    getOptionLabel={(option) => `${option.code} ${option.name}`}
                    value={selectedOption}
                    onChange={(_, value) => {
                      field.onChange(value ? value.id : "");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cuenta de Ingresos"
                        variant="outlined"
                        size="small"
                        error={!!errors.inventoryAccountId}
                        helperText={errors.inventoryAccountId?.message}
                        fullWidth
                      />
                    )}
                  />
                );
              }}
            />

            <Controller
              name="costAccountId"
              control={control}
              render={({ field }) => {
                const selectedOption =
                  accounts.find((a) => a.id === field.value) || null;

                return (
                  <Autocomplete
                    options={accounts}
                    getOptionLabel={(option) => `${option.code} ${option.name}`}
                    value={selectedOption}
                    onChange={(_, value) => {
                      field.onChange(value ? value.id : "");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cuenta de Ingresos"
                        variant="outlined"
                        size="small"
                        error={!!errors.costAccountId}
                        helperText={errors.costAccountId?.message}
                        fullWidth
                      />
                    )}
                  />
                );
              }}
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
