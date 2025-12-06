"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  Button,
  TableContainer,
  IconButton,
  TextField,
  MenuItem,
} from "@mui/material";
import { Delete, Plus } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { sriPaymentMethods } from "@/constants/sri";
import { useEffect } from "react";

export const PaymentMethodsTable = () => {
  const { control, setValue, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "documentPayments",
  });

  const items = watch("items") || [];
  const total = items.reduce((sum: number, item: any) => sum + item.total, 0);

  useEffect(() => {
    const payments = watch("documentPayments") || [];
    if (payments.length > 0) {
      setValue(`documentPayments.${0}.amount`, total);
    }
  }, [total, setValue, watch]);

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
              <TableCell>Forma de pago</TableCell>
              <TableCell align="center">Plazo</TableCell>
              <TableCell align="center">Unid. de tiempo</TableCell>
              <TableCell align="center">Valor</TableCell>
              <TableCell align="center" />
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell width={300}>
                  <Controller
                    control={control}
                    name={`documentPayments.${index}.paymentMethod`}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        size="small"
                        select
                        value={field.value || "20"}
                        onChange={field.onChange}
                      >
                        {sriPaymentMethods.map((method) => (
                          <MenuItem key={method.value} value={method.value}>
                            {method.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </TableCell>
                <TableCell align="right" width={150}>
                  <Controller
                    control={control}
                    name={`documentPayments.${index}.term`}
                    render={({ field }) => (
                      <TextField
                        type="number"
                        value={field.value || 0}
                        onChange={field.onChange}
                        size="small"
                      />
                    )}
                  />
                </TableCell>
                <TableCell width={150}>
                  <Controller
                    control={control}
                    name={`documentPayments.${index}.termUnit`}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        size="small"
                        select
                        value={field.value || "días"}
                        onChange={field.onChange}
                      >
                        <MenuItem value="días">Días</MenuItem>
                        <MenuItem value="meses">Meses</MenuItem>
                      </TextField>
                    )}
                  />
                </TableCell>
                <TableCell align="right" width={150}>
                  <Controller
                    control={control}
                    name={`documentPayments.${index}.amount`}
                    render={({ field }) => (
                      <TextField
                        type="number"
                        value={field.value || 0}
                        onChange={(e) => {
                          const text = e.target.value;
                          field.onChange(text);
                        }}
                        onBlur={() => {
                          const numeric = parseFloat(
                            field.value ? field.value.toString() : "0"
                          );
                          // Al salir del input conviertes a number seguro
                          field.onChange(
                            isNaN(numeric) ? 0 : Number(numeric.toFixed(2))
                          );
                        }}
                        size="small"
                      />
                    )}
                  />
                </TableCell>
                <TableCell align="center" width={50}>
                  <IconButton color="error" onClick={() => remove(index)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
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
};
