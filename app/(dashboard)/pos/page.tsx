"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  Stack,
} from "@mui/material";
import {
  Search,
  LogOut,
  User,
  CreditCard,
  DollarSign,
  Trash2,
  Plus,
  Printer,
} from "lucide-react";

/**
 * POS Fullscreen Template (MVP)
 *
 * - Minimalista, teclado friendly
 * - Grid de productos + carrito de la derecha
 * - Modal de pago con cálculo de vuelto
 * - Mock de "imprimir ticket" con window.print()
 *
 * Notas:
 * - Reemplaza los mocks por tus llamadas a backend (products, createSale, createTransaction)
 * - Cambia estilos y theme según tu design system
 */

/* ---------------------------
  Tipos y datos de ejemplo
----------------------------*/
type Product = {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock?: number;
  vatPercent?: number; // ej. 12
  image?: string | null;
  category?: string;
};

type CartLine = {
  id: string; // product id
  name: string;
  price: number;
  qty: number;
  vatPercent?: number;
};

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Café Espresso",
    sku: "CFE-ESP",
    price: 2.5,
    stock: 100,
    vatPercent: 12,
  },
  {
    id: "p2",
    name: "Sandwich Jamón",
    sku: "SN-SJ",
    price: 4.2,
    stock: 40,
    vatPercent: 12,
  },
  {
    id: "p3",
    name: "Agua Mineral 500ml",
    sku: "AG-500",
    price: 1.2,
    stock: 80,
    vatPercent: 0,
  },
  {
    id: "p4",
    name: "Té Verde",
    sku: "TE-VER",
    price: 2.0,
    stock: 50,
    vatPercent: 12,
  },
  {
    id: "p5",
    name: "Producto Demo L4",
    sku: "PD-L4",
    price: 12.0,
    stock: 10,
    vatPercent: 12,
  },
];

/* ---------------------------
  Helpers
----------------------------*/
const fmt = (n: number) => Number(n.toFixed(2));
const calcLineTotal = (line: CartLine) => fmt(line.price * line.qty);
const calcLineVat = (line: CartLine) =>
  fmt(((line.vatPercent || 0) / 100) * line.price * line.qty);

/* ---------------------------
  Component: PaymentModal
----------------------------*/
function PaymentModal({
  open,
  total,
  onClose,
  onConfirm,
}: {
  open: boolean;
  total: number;
  onClose: () => void;
  onConfirm: (payload: { method: string; received: number }) => void;
}) {
  const [method, setMethod] = useState<string>("CASH");
  const [received, setReceived] = useState<number>(0);

  useEffect(() => {
    if (!open) {
      setMethod("CASH");
      setReceived(0);
    }
  }, [open]);

  const change = useMemo(
    () => fmt(Math.max(0, received - total)),
    [received, total]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Pago — Total {`$ ${fmt(total)}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small">
            <Select
              value={method}
              onChange={(e) => setMethod(String(e.target.value))}
            >
              <MenuItem value="CASH">Efectivo</MenuItem>
              <MenuItem value="TRANSFER">Transferencia</MenuItem>
              <MenuItem value="CARD">Tarjeta</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Monto recibido"
            type="number"
            size="small"
            value={received === 0 ? "" : String(received)}
            onChange={(e) => setReceived(Number(e.target.value || 0))}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            fullWidth
          />

          {method === "CASH" && (
            <Box sx={{ display: "flex", gap: 1 }}>
              {[1, 5, 10, 20, 50, 100].map((v) => (
                <Button
                  key={v}
                  size="small"
                  variant="outlined"
                  onClick={() => setReceived((r) => fmt(r + v))}
                >
                  +{v}
                </Button>
              ))}
            </Box>
          )}

          <Box>
            <Typography variant="caption" color="text.secondary">
              Cambio:
            </Typography>
            <Typography variant="h6">{`$ ${fmt(change)}`}</Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => {
            onConfirm({ method, received });
          }}
        >
          Confirmar pago
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ---------------------------
  Component: ProductCard
----------------------------*/
function ProductCard({
  p,
  onAdd,
}: {
  p: Product;
  onAdd: (prod: Product) => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          <Typography fontWeight={700} variant="subtitle1">
            {p.name}
          </Typography>
          <Chip label={p.category || "General"} size="small" />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          SKU: {p.sku}
        </Typography>

        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            ${fmt(p.price)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {(p.vatPercent || 0) > 0 ? `${p.vatPercent}% IVA` : "Sin IVA"}
          </Typography>
        </Box>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          startIcon={<Plus />}
          onClick={() => onAdd(p)}
          fullWidth
        >
          Agregar
        </Button>
      </CardActions>
    </Card>
  );
}

/* ---------------------------
  Main POS component
----------------------------*/
export default function POSTemplate() {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [docType, setDocType] = useState<
    "PROFORMA" | "TICKET" | "SALE_NOTE" | "INVOICE"
  >("TICKET");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // keyboard shortcuts
    function onKey(e: KeyboardEvent) {
      // Ctrl+B focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // F2 quick add first product (dev)
      if (e.key === "F2") {
        e.preventDefault();
        if (products[0]) addProductToCart(products[0]);
      }
      // F8 => open payment if cart not empty
      if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) setPaymentOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [products, cart]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      `${p.name} ${p.sku} ${p.category || ""}`.toLowerCase().includes(q)
    );
  }, [products, query]);

  function addProductToCart(product: Product) {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          qty: 1,
          vatPercent: product.vatPercent,
        },
      ];
    });
  }

  function updateQty(id: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.id !== id));
  }

  const subtotal = useMemo(
    () => fmt(cart.reduce((s, l) => s + l.price * l.qty, 0)),
    [cart]
  );
  const vat = useMemo(
    () => fmt(cart.reduce((s, l) => s + calcLineVat(l), 0)),
    [cart]
  );
  const total = useMemo(() => fmt(subtotal + vat), [subtotal, vat]);

  function handleConfirmPayment(payload: { method: string; received: number }) {
    // Mock: create Sale, SaleDocument, Transaction, Movement
    // En tu sistema real: llamar a endpoint que cree Sale + SaleDocument + Transaction + Movements
    const sale = {
      id: "sale_" + Date.now(),
      docType,
      items: cart,
      total,
      createdAt: new Date().toISOString(),
    };

    console.log("SALE CREATED (mock)", sale);
    console.log("PAYMENT:", payload);

    // Simula imprimir ticket
    setTimeout(() => {
      window.print();
    }, 300);

    // reset
    setCart([]);
    setPaymentOpen(false);
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f5f6f8",
      }}
    >
      {/* Topbar */}
      <AppBar
        position="static"
        color="default"
        elevation={1}
        sx={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <Toolbar sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              MyPOS
            </Typography>
            <Chip label="Pto. Emisión: 001-001" />
          </Box>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Vendedor: Juan
            </Typography>
            <IconButton size="small">
              <User size={16} />
            </IconButton>
            <IconButton size="small">
              <LogOut size={16} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", gap: 2, p: 2 }}>
        {/* Left: catalog */}
        <Box
          sx={{
            width: "60%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                inputRef={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto por nombre, código o SKU (Ctrl+B)"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl size="small" sx={{ width: 180 }}>
                <Select
                  value={docType}
                  onChange={(e) => setDocType(String(e.target.value) as any)}
                >
                  <MenuItem value="PROFORMA">Proforma</MenuItem>
                  <MenuItem value="TICKET">Ticket</MenuItem>
                  <MenuItem value="SALE_NOTE">Nota de Venta</MenuItem>
                  <MenuItem value="INVOICE">Factura</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                onClick={() => window.print()}
                startIcon={<Printer />}
              >
                Imprimir
              </Button>
            </Box>
          </Paper>

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <Grid container spacing={2}>
              {filtered.map((p) => (
                <Grid key={p.id} size={{ xs: 6, sm: 4, md: 3 }}>
                  <ProductCard p={p} onAdd={addProductToCart} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Right: cart */}
        <Box
          sx={{
            width: "40%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Venta actual</Typography>
              <Button size="small" onClick={() => setCart([])}>
                Limpiar
              </Button>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Table size="small" aria-label="cart">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      Agrega productos al carrito
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Typography fontWeight={600}>{line.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {line.id}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 1,
                          }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => updateQty(line.id, line.qty - 1)}
                          >
                            -
                          </Button>
                          <Typography>{line.qty}</Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => updateQty(line.id, line.qty + 1)}
                          >
                            +
                          </Button>
                        </Box>
                      </TableCell>

                      <TableCell align="right">${fmt(line.price)}</TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 1,
                          }}
                        >
                          <Typography>${fmt(calcLineTotal(line))}</Typography>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => removeLine(line.id)}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography>${subtotal}</Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="text.secondary">IVA</Typography>
              <Typography>${vat}</Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="h5" fontWeight={700}>
                Total
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary">
                ${total}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DollarSign />}
                fullWidth
                disabled={cart.length === 0}
                onClick={() => setPaymentOpen(true)}
              >
                Cobrar (F8)
              </Button>

              <Button
                variant="outlined"
                startIcon={<CreditCard />}
                disabled={cart.length === 0}
                onClick={() => {
                  setPaymentOpen(true);
                }}
              >
                Pago
              </Button>
            </Box>

            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => alert("Abrir clientes (mock)")}
              >
                Cliente
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => alert("Abrir descuentos (mock)")}
              >
                Descuento
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => alert("Aplicar nota (mock)")}
              >
                Nota
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      <PaymentModal
        open={paymentOpen}
        total={total}
        onClose={() => setPaymentOpen(false)}
        onConfirm={(payload) => {
          handleConfirmPayment(payload);
        }}
      />
    </Box>
  );
}
