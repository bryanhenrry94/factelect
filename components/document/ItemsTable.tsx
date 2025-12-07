"use client";

import { Product } from "@/lib/validations/inventory/product";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Button,
  TableContainer,
  TextField,
  MenuItem,
  Stack,
  IconButton,
} from "@mui/material";
import { Delete, Plus, PlusCircle } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { getProductById } from "@/actions";
import { taxOptions } from "@/constants/tax";
import { useEffect } from "react";

export default function InvoiceItemsTable({
  warehouses,
  products,
}: {
  warehouses: Warehouse[];
  products: Product[];
}) {
  const { control, watch, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const handleChangeProduct = async (productId: string, index: number) => {
    const productResponse = await getProductById(productId);
    if (productResponse.success && productResponse.data) {
      const product = productResponse.data;

      setValue(`items.${index}.unitPrice`, product.price);
      setValue(`items.${index}.tax`, product.tax);
      setValue(`items.${index}.quantity`, 1);
    }
  };

  return (
    <Box>
      <TableContainer
        sx={{
          mt: 2,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          bgcolor: "background.paper",
        }}
      >
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
              <TableCell>Bodega</TableCell>
              <TableCell align="center">Item</TableCell>
              <TableCell align="center">Cantidad</TableCell>
              <TableCell align="center">Precio</TableCell>
              <TableCell align="center">Impuesto</TableCell>
              <TableCell align="center">% Desc.</TableCell>
              <TableCell align="center">Descuento</TableCell>
              <TableCell align="center">Subtotal</TableCell>
              <TableCell align="center" />
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => {
              const quantity = watch(`items.${index}.quantity`) ?? 0;
              const unitPrice = watch(`items.${index}.unitPrice`) ?? 0;
              const discountRate = watch(`items.${index}.discountRate`) ?? 0;
              const tax = watch(`items.${index}.tax`) || "IVA_0";

              const taxRate =
                taxOptions.find((option) => option.value === tax)?.rate ?? 0;

              const subtotal = quantity * unitPrice;
              const discountAmount = (subtotal * discountRate) / 100;
              const subtotalAfterDiscount = subtotal - discountAmount;
              const totalWithTax =
                subtotalAfterDiscount + subtotalAfterDiscount * taxRate;

              // 👇 actualiza valores computados al cambiar dependencias
              useEffect(() => {
                setValue(
                  `items.${index}.taxAmount`,
                  subtotalAfterDiscount * taxRate
                );
                setValue(`items.${index}.discountAmount`, discountAmount);
                setValue(`items.${index}.subtotal`, subtotalAfterDiscount);
                setValue(`items.${index}.total`, totalWithTax);
              }, [
                quantity,
                unitPrice,
                discountRate,
                tax,
                subtotalAfterDiscount,
                discountAmount,
                totalWithTax,
                taxRate,
                index,
                setValue,
              ]);

              return (
                <TableRow
                  hover
                  sx={{
                    "& td": { py: 1 },
                  }}
                  key={index}
                >
                  <TableCell sx={{ minWidth: 160, width: "12%" }}>
                    <Controller
                      control={control}
                      name={`items.${index}.warehouseId`}
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          size="small"
                          select
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e);
                            handleChangeProduct(e.target.value, index);
                          }}
                        >
                          {warehouses?.map((warehouse) => (
                            <MenuItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 230, width: "22%" }}>
                    <Stack direction="row" gap={2}>
                      <Controller
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <TextField
                            fullWidth
                            size="small"
                            select
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e);
                              handleChangeProduct(e.target.value, index);
                            }}
                          >
                            {products.map((product) => (
                              <MenuItem key={product.id} value={product.id}>
                                {product.description}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />

                      <IconButton onClick={() => {}} color="primary">
                        <PlusCircle />
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ minWidth: 80, width: "7%" }}>
                    <Controller
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          value={field.value ?? 1}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          slotProps={{
                            htmlInput: {
                              min: 0,
                              step: "0.01", // permite decimales
                            },
                          }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 100, width: "9%" }}>
                    <Controller
                      control={control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          value={field.value ?? 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          slotProps={{
                            htmlInput: {
                              min: 0,
                              step: "0.01", // permite decimales
                            },
                          }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 95, width: "8%" }}>
                    <Controller
                      control={control}
                      name={`items.${index}.tax`}
                      render={({ field }) => (
                        <TextField
                          fullWidth
                          size="small"
                          select
                          value={field.value || ""}
                          onChange={field.onChange}
                        >
                          {taxOptions.map(({ label, value, code }) => (
                            <MenuItem key={code} value={value}>
                              {label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 95, width: "8%" }}>
                    <Controller
                      control={control}
                      name={`items.${index}.discountRate`}
                      render={({ field }) => (
                        <TextField
                          type="number"
                          fullWidth
                          size="small"
                          value={field.value ?? 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          slotProps={{
                            htmlInput: {
                              min: 0,
                              max: 100,
                              step: "0.01",
                            },
                          }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ minWidth: 100, width: "10%", fontWeight: 600 }}
                  >{`$${(discountAmount ?? 0).toFixed(2)}`}</TableCell>
                  <TableCell>{`$${totalWithTax.toFixed(2)}`}</TableCell>
                  <TableCell
                    sx={{
                      minWidth: 60,
                      width: "6%",
                      textAlign: "center",
                    }}
                  >
                    <IconButton color="error" onClick={() => remove(index)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        color="primary"
        variant="outlined"
        sx={{ mt: 2 }}
        onClick={() =>
          append({
            productId: "",
            quantity: 1,
            unitPrice: 0,
            tax: "IVA_0",
            taxAmount: 0,
            discountRate: 0,
            discountAmount: 0,
            subtotal: 0,
          })
        }
        startIcon={<Plus size={16} />}
      >
        Agregar detalle
      </Button>
    </Box>
  );
}
