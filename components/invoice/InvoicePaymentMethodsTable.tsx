"use client";
import { sriPaymentMethods } from "@/constants/sri";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  TextField,
  Box,
  MenuItem,
  TableContainer,
  Button,
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";

export default function InvoicePaymentMethodsTable() {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "paymentMethods",
  });

  return (
    <Box>
      <TableContainer>
        <Table
          sx={{
            minWidth: 650,
            "& .MuiTableCell-root": {
              border: "1px solid rgba(224, 224, 224, 1)",
            },
          }}
          size="small"
          aria-label="a dense table"
        >
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  width: 450,
                }}
              >
                Método
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Plazo
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  width: 150,
                }}
              >
                Und. Tiempo
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Monto
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              />
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => {
              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <Controller
                      name={`paymentMethods.${index}.paymentMethod`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          size="small"
                          fullWidth
                          {...field}
                          value={field.value || ""}
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
                  <TableCell>
                    <Controller
                      name={`paymentMethods.${index}.term`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          type="number"
                          size="small"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          slotProps={{
                            htmlInput: {
                              min: 0,
                              step: "1",
                            },
                          }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`paymentMethods.${index}.timeUnit`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          size="small"
                          fullWidth
                          {...field}
                          value={field.value || ""}
                        >
                          <MenuItem value="DAYS">Días</MenuItem>
                          <MenuItem value="MONTHS">Meses</MenuItem>
                          <MenuItem value="YEARS">Años</MenuItem>
                        </TextField>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`paymentMethods.${index}.amount`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          type="number"
                          size="small"
                          {...field}
                          value={field.value || 0}
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
                    <IconButton color="error" onClick={() => remove(index)}>
                      <Trash2 />
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
        onClick={() =>
          append({
            invoiceId: "",
            paymentMethod: "20",
            amount: 0,
            term: 0,
            timeUnit: "DAYS",
          })
        }
        startIcon={<Plus />}
      >
        Agregar detalle
      </Button>
    </Box>
  );
}
