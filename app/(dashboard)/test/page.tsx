"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  IconButton,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Paper,
  Collapse,
} from "@mui/material";

import { Save, Printer, CreditCard, Plus, X, User } from "lucide-react";
import { useState } from "react";

export default function SalePage() {
  const [docType, setDocType] = useState("PROFORMA");
  const [openCustomer, setOpenCustomer] = useState(true);

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", margin: "0 auto" }}>
      {/* -------------------------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------------------------- */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Tabs
          value={docType}
          onChange={(e, v) => setDocType(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Proforma" value="PROFORMA" />
          <Tab label="Nota de Venta" value="SALE_NOTE" />
          <Tab label="Ticket" value="TICKET" />
          <Tab label="Factura" value="INVOICE" />
        </Tabs>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" color="info" startIcon={<Printer />}>
            Imprimir
          </Button>
          <Button variant="contained" startIcon={<Save />}>
            Guardar
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* -------------------------------------------------- */}
      {/* CLIENTE */}
      {/* -------------------------------------------------- */}
      <Card
        variant="outlined"
        sx={{
          mt: 3,
          borderRadius: 2,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ cursor: "pointer" }}
            onClick={() => setOpenCustomer(!openCustomer)}
          >
            <Typography
              fontWeight={600}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <User size={18} /> Cliente
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {openCustomer ? "Ocultar" : "Mostrar"}
            </Typography>
          </Box>

          <Collapse in={openCustomer}>
            <Box
              mt={2}
              display="grid"
              gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
              gap={2}
            >
              <Autocomplete
                options={[]} // Productos o clientes
                renderInput={(params) => (
                  <TextField {...params} label="Buscar cliente" size="small" />
                )}
              />

              <TextField label="Identificación" size="small" />
              <TextField label="Teléfono" size="small" />
              <TextField fullWidth label="Dirección" size="small" />
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* ITEMS */}
      {/* -------------------------------------------------- */}
      <Card
        variant="outlined"
        sx={{ mt: 3, borderRadius: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography fontWeight={600}>Productos / Servicios</Typography>

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Autocomplete
              sx={{ flex: 3 }}
              options={[]}
              renderInput={(params) => (
                <TextField {...params} label="Buscar producto" size="small" />
              )}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<Plus />}
              sx={{ borderRadius: 2 }}
            >
              Agregar
            </Button>
          </Box>

          <Paper variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell align="center">-</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Ejemplo de línea */}
                <TableRow>
                  <TableCell>Producto de ejemplo</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={1}
                      sx={{ width: 70 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={10}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>$10.00</TableCell>
                  <TableCell align="center">
                    <IconButton color="error" size="small">
                      <X />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- */}
      {/* TOTAL + PAGOS */}
      {/* -------------------------------------------------- */}
      <Box
        sx={{
          mt: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 3,
        }}
      >
        {/* Totales */}
        <Card
          variant="outlined"
          sx={{
            flex: 1,
            borderRadius: 2,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography fontWeight={600} mb={1}>
              Resumen
            </Typography>

            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>$10.00</Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography color="text.secondary">IVA</Typography>
              <Typography>$1.20</Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography fontWeight={700}>Total</Typography>
              <Typography fontWeight={700} color="primary">
                $11.20
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Pagos */}
        <Card
          variant="outlined"
          sx={{
            flex: 1,
            borderRadius: 2,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography fontWeight={600} mb={2}>
              Pago
            </Typography>

            <TextField
              label="Método de pago"
              size="small"
              fullWidth
              select
              SelectProps={{ native: true }}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
            </TextField>

            <TextField
              label="Monto recibido"
              size="small"
              fullWidth
              sx={{ mt: 2 }}
              type="number"
            />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<CreditCard />}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              Registrar Pago
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
