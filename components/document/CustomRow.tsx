import React, { memo, useEffect } from "react";
import {
  TableRow,
  TableCell,
  TextField,
  MenuItem,
  IconButton,
  Stack,
} from "@mui/material";
import { PlusCircle, Delete } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { taxOptions } from "@/constants/tax";
import { getProductById } from "@/actions";

const taxRates: Record<string, number> = {
  IVA_0: 0,
  IVA_5: 0.05,
  IVA_12: 0.12,
  IVA_14: 0.14,
  IVA_15: 0.15,
  NO_IVA: 0,
  EXENTO_DE_IVA: 0,
};

interface CustomRowProps {
  field: any;
  index: number;
  products: any[];
  remove: (index: number) => void;
}

/**
 * ✅ OPTIMIZACIONES:
 * - `memo` evita re-render si las props no cambian.
 * - Usa `useState` local para controlar valores de inputs.
 * - Actualiza el array padre solo cuando es necesario.
 */
const CustomRow: React.FC<CustomRowProps> = memo(
  ({ field, index, products, remove }) => {
    const {
      control,
      formState: { errors },
      watch,
      setValue,
    } = useFormContext(); // <- accedemos al contexto del formulario

    // const items = watch("items");
    // console.log("items: ", items);

    const handleChangeProduct = async (productId: string) => {
      const productResponse = await getProductById(productId);
      if (productResponse.success && productResponse.data) {
        const product = productResponse.data;

        setValue(`items.${index}.unitPrice`, product.price);
        setValue(`items.${index}.tax`, product.tax);
        setValue(`items.${index}.quantity`, 1);
      }
    };

    // Calcular totales automáticamente con react-hook-form watch
    const quantity = watch(`items.${index}.quantity`) ?? 0;
    const unitPrice = watch(`items.${index}.unitPrice`) ?? 0;
    const discountRate = watch(`items.${index}.discountRate`) ?? 0;
    const tax = watch(`items.${index}.tax`) || "IVA_0";

    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discountRate) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxRate = taxRates[tax] || 0;
    const totalWithTax =
      subtotalAfterDiscount + subtotalAfterDiscount * taxRate;

    // Actualizar los valores calculados en el formulario
    useEffect(() => {
      setValue(`items.${index}.taxAmount`, subtotalAfterDiscount * taxRate);
      setValue(`items.${index}.discountRate`, discountRate);
      setValue(`items.${index}.discountAmount`, discountAmount);
      setValue(`items.${index}.subtotal`, subtotalAfterDiscount);
      setValue(`items.${index}.total`, totalWithTax);
    }, [
      discountAmount,
      subtotalAfterDiscount,
      taxRate,
      totalWithTax,
      index,
      setValue,
    ]);

    return (
      <TableRow
        hover
        sx={{
          "& td": { py: 1 },
        }}
      >
        <TableCell>
          <Stack direction="row" gap={2}>
            <Controller
              control={control}
              name={`items.${index}.productId`}
              render={({ field }) => (
                <TextField
                  fullWidth
                  size="small"
                  select
                  sx={{ width: 200 }}
                  value={field.value || ""}
                  onChange={(e) => {
                    field.onChange(e);
                    handleChangeProduct(e.target.value);
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
        <TableCell>
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
        <TableCell>
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
        <TableCell>
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
        <TableCell>
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
        <TableCell>{`$${(discountAmount ?? 0).toFixed(2)}`}</TableCell>
        <TableCell>{`$${totalWithTax.toFixed(2)}`}</TableCell>
        <TableCell>
          <IconButton color="error" onClick={() => remove(index)}>
            <Delete />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
);

CustomRow.displayName = "CustomRow";
export default CustomRow;
