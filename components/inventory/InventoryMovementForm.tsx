"use client";
import { use, useEffect, useState } from "react";
import {
  CreateInventoryMovement,
  createInventoryMovementSchema,
} from "@/lib/validations/inventory/inventory-movement";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Delete, Plus } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { getWarehouses } from "@/actions/inventory/warehouse";
import { Product } from "@/lib/validations";
import { getAllProducts } from "@/actions";
import { Unit } from "@/lib/validations/unit";
import { getUnits } from "@/actions/unit";
import { formatCurrency } from "@/utils/formatters";
import {
  createInventoryMovement,
  getInventoryMovementById,
  updateInventoryMovement,
} from "@/actions/inventory/inventory-movement";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { getStockByProductAndWarehouse } from "@/actions/inventory/stock";

const initialValues: CreateInventoryMovement = {
  type: "IN",
  date: new Date(),
  warehouseId: "",
  description: "",
  items: [
    {
      productId: "",
      quantity: 0,
      unitId: "",
      cost: 0,
      totalCost: 0,
    },
  ],
};

interface InventoryMovementFormProps {
  inventoryMovementId?: string;
}

export const InventoryMovementForm: React.FC<InventoryMovementFormProps> = ({
  inventoryMovementId,
}) => {
  const { data: session } = useSession();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CreateInventoryMovement>({
    resolver: zodResolver(createInventoryMovementSchema),
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!session?.user.tenantId) return;

      const response = await getWarehouses(session.user.tenantId);
      if (response.success) {
        setWarehouses(response.data);
      } else {
        setWarehouses([]);
      }
    };

    const fetchProducts = async () => {
      if (!session?.user.tenantId) return;
      const response = await getAllProducts(session?.user.tenantId);

      if (response.success) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    };

    const fetchUnits = async () => {
      if (!session?.user.tenantId) return;

      const response = await getUnits(session.user.tenantId);
      if (response.success) {
        setUnits(response.data);
      } else {
        setUnits([]);
      }
    };

    fetchUnits();
    fetchWarehouses();
    fetchProducts();
  }, [session?.user.tenantId]);

  useEffect(() => {
    if (inventoryMovementId) {
      const fetchInventoryMovement = async () => {
        const response = await getInventoryMovementById(inventoryMovementId);
        if (response.success && response.data) {
          const inventoryMovement = response.data;

          // Mapear los datos para que coincidan con el formulario
          const formData: CreateInventoryMovement = {
            type: inventoryMovement.type,
            date: inventoryMovement.date,
            warehouseId: inventoryMovement.warehouseId,
            description: inventoryMovement.description || "",
            items: inventoryMovement.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitId: item.unitId,
              cost: item.cost,
              totalCost: item.totalCost,
            })),
          };

          reset(formData);
        }
      };

      fetchInventoryMovement();
    }
  }, [inventoryMovementId]);

  const handleChangeProduct = async (index: number, productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    if (!selectedProduct) {
      setValue(`items.${index}.quantity`, 0);
      setValue(`items.${index}.unitId`, "");
      setValue(`items.${index}.cost`, 0);
      setValue(`items.${index}.totalCost`, 0);
      return;
    }

    let stock: number = 0;

    if (watch("type") === "OUT") {
      const response = await getStockByProductAndWarehouse(
        productId,
        watch("warehouseId")
      );

      if (response.success) {
        stock = response.data?.avgCost || 0;
      }
    }

    const qty = watch(`items.${index}.quantity`);
    const cost = stock;

    setValue(`items.${index}.unitId`, selectedProduct.unitId);
    setValue(`items.${index}.cost`, cost);
    setValue(`items.${index}.totalCost`, cost * (qty || 0));
  };

  // Calcula totalCost automáticamente cuando quantity o cost cambian
  const watchedItems = watch("items");

  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.cost) || 0;
      const total = qty * cost;

      // Solo actualiza si realmente cambió para evitar render loops
      if (item.totalCost !== total) {
        setValue(`items.${index}.totalCost`, total);
      }
    });
  }, [watchedItems, setValue]);

  const onSubmit = async (data: CreateInventoryMovement) => {
    try {
      console.log(data);

      if (!session?.user.tenantId) {
        notifyError("No se encontró el tenantId del usuario.");
        return;
      }

      const response = inventoryMovementId
        ? await updateInventoryMovement(inventoryMovementId, data)
        : await createInventoryMovement(session.user.tenantId, data);

      if (response.success) {
        notifyInfo(
          `Movimiento ${
            inventoryMovementId ? "actualizado" : "creado"
          } exitosamente.`
        );

        if (!inventoryMovementId) reset(initialValues);
      } else {
        notifyError(response.error || "Error al guardar el movimiento.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      notifyError("Error inesperado al guardar el movimiento.");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Nuevo Movimiento
        </Typography>
        {/* {JSON.stringify(errors)} */}
        <Stack spacing={2} direction={"column"} sx={{ maxWidth: 400 }}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Fecha"
                type="date"
                variant="outlined"
                margin="dense"
                size="small"
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  field.onChange(new Date(selectedDate));
                }}
                value={
                  field.value ? field.value.toISOString().split("T")[0] : ""
                }
                error={errors.date ? true : false}
                helperText={errors.date?.message}
              />
            )}
          />
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Tipo de Movimiento"
                select
                margin="normal"
                size="small"
              >
                <MenuItem value="IN">Entrada</MenuItem>
                <MenuItem value="OUT">Salida</MenuItem>
                <MenuItem value="TRANSFER">Transferencia</MenuItem>
                <MenuItem value="ADJUST">Ajuste</MenuItem>
              </TextField>
            )}
          />

          <Controller
            name="warehouseId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Bodega"
                variant="outlined"
                margin="dense"
                size="small"
                error={errors.warehouseId ? true : false}
                helperText={errors.warehouseId?.message}
                select
                value={field.value || ""}
              >
                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Descripción"
                variant="outlined"
                margin="dense"
                size="small"
                error={errors.description ? true : false}
                helperText={errors.description?.message}
                multiline
                rows={3}
              />
            )}
          />
        </Stack>
      </Card>

      <Card sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Ítems del Movimiento
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: "grey.100",
                  "& th": {
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: "0.85rem",
                    color: "grey.700",
                  },
                }}
              >
                <TableCell sx={{ width: 350 }}>Producto</TableCell>
                <TableCell sx={{ width: 150 }}>Cantidad</TableCell>
                <TableCell sx={{ width: 150 }}>Unidad</TableCell>
                <TableCell sx={{ width: 150 }}>Costo</TableCell>
                <TableCell sx={{ width: 150 }}>Costo Total</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay ítems agregados.
                  </TableCell>
                </TableRow>
              )}

              {fields.map((item, index) => (
                <TableRow key={item.id}>
                  {/* PRODUCTO */}
                  <TableCell>
                    <Controller
                      name={`items.${index}.productId`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          variant="outlined"
                          margin="dense"
                          size="small"
                          fullWidth
                          select
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChangeProduct(index, e.target.value);
                          }}
                        >
                          <MenuItem value={""}>Seleccionar Producto</MenuItem>
                          {products.map((product) => (
                            <MenuItem key={product.id} value={product.id}>
                              {product.code} {product.description}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>

                  {/* CANTIDAD */}
                  <TableCell>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          variant="outlined"
                          margin="dense"
                          size="small"
                          fullWidth
                          onChange={(e) => {
                            const value = Number(e.target.value) || 0;
                            field.onChange(value);
                            const cost = watch(`items.${index}.cost`) || 0;
                            setValue(`items.${index}.totalCost`, value * cost);
                          }}
                        />
                      )}
                    />
                  </TableCell>

                  {/* UNIDAD */}
                  <TableCell>
                    <Controller
                      name={`items.${index}.unitId`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          variant="outlined"
                          margin="dense"
                          size="small"
                          select
                          fullWidth
                          value={field.value || ""}
                          slotProps={{
                            input: { readOnly: true },
                          }}
                        >
                          {units.map((unit) => (
                            <MenuItem key={unit.id} value={unit.id}>
                              {unit.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>

                  {/* COSTO */}
                  <TableCell>
                    {watch("type") === "OUT" ? (
                      formatCurrency(watch(`items.${index}.cost`) || 0)
                    ) : (
                      <Controller
                        name={`items.${index}.cost`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            variant="outlined"
                            margin="dense"
                            size="small"
                            fullWidth
                            onChange={(e) => {
                              const value = Number(e.target.value) || 0;
                              field.onChange(value);
                              const qty = watch(`items.${index}.quantity`) || 0;
                              setValue(`items.${index}.totalCost`, qty * value);
                            }}
                          />
                        )}
                      />
                    )}
                  </TableCell>

                  {/* COSTO TOTAL */}
                  <TableCell>
                    {formatCurrency(watch(`items.${index}.totalCost`) || 0)}
                  </TableCell>

                  {/* ACCIONES */}
                  <TableCell>
                    <IconButton color="error" onClick={() => remove(index)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              <TableRow>
                <TableCell colSpan={6} align="left">
                  <Button
                    variant="text"
                    startIcon={<Plus size={16} />}
                    onClick={() =>
                      append({
                        productId: "",
                        quantity: 0,
                        unitId: "",
                        cost: 0,
                        totalCost: 0,
                      })
                    }
                  >
                    Agregar Ítem
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Agrega más campos del formulario aquí */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar Movimiento"}
        </Button>
      </Box>
    </Box>
  );
};
