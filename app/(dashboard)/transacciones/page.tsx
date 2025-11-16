"use client";

import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TableContainer,
  Paper,
  CircularProgress,
  Table,
} from "@mui/material";
import { Delete, Edit, File, Plus } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getTransaction, getTransactions } from "@/app/actions";
import { TransactionInput } from "@/lib/validations";
import { formatDate } from "@/utils/formatters";
import { getTransactionTypeLabel } from "@/utils/transaction";
import { getPaymentMethodLabel } from "@/utils/paymentMethods";

const TransactionsPage = () => {
  const { data: session } = useSession();
  const [transactions, setTransactions] = React.useState<TransactionInput[]>(
    []
  );
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const router = useRouter();

  const handleAdd = () => router.push("/transacciones/nueva");

  const handleEdit = (t: TransactionInput) => {};

  const handleDelete = (id: string) => {};

  const fetchTransactions = async () => {
    try {
      if (!session?.user?.tenantId) return;
      setLoading(true);

      const res = await getTransactions(session.user.tenantId);

      if (res.success && res.data) {
        setTransactions(res.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      setError("No se pudieron obtener las transacciones.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, [session?.user?.tenantId]);

  return (
    <PageContainer
      title="Transacciones"
      description="Administra las transacciones de tu negocio"
    >
      <PageHeader title="Transacciones" />

      {/* Header actions */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField
          label="Buscar transacciones"
          variant="outlined"
          size="small"
          fullWidth={false}
        />

        <Button variant="contained" startIcon={<Plus />} onClick={handleAdd}>
          Nueva Transacción
        </Button>
      </Box>

      {/* Main content */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          {loading ? (
            <Box py={6} textAlign="center">
              <CircularProgress />
              <Typography variant="body2" mt={2} color="text.secondary">
                Cargando transacciones...
              </Typography>
            </Box>
          ) : transactions.length === 0 ? (
            <Box textAlign="center" py={6}>
              <File size={42} />
              <Typography variant="h6" mt={2}>
                No hay transacciones registradas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega tu primera transacción para comenzar
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      "Tipo",
                      "Método",
                      "Persona",
                      "Fecha",
                      "Referencia",
                      "Descripción",
                      "Acciones",
                    ].map((label) => (
                      <TableCell key={label} sx={{ fontWeight: 600 }}>
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {transactions.map((t) => (
                    <TableRow
                      key={t.id}
                      hover
                      sx={{
                        "&:last-child td": { border: 0 },
                        "&:nth-of-type(odd)": {
                          backgroundColor: "rgba(0,0,0,0.015)",
                        },
                      }}
                    >
                      <TableCell>{getTransactionTypeLabel(t.type)}</TableCell>
                      <TableCell>{getPaymentMethodLabel(t.method)}</TableCell>
                      <TableCell>{t.personId}</TableCell>
                      <TableCell>
                        {formatDate(t.issueDate.toString())}
                      </TableCell>
                      <TableCell>{t.reference || "-"}</TableCell>
                      <TableCell>{t.description || "-"}</TableCell>

                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(t)}
                        >
                          <Edit size={18} />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() => handleDelete(t.id || "")}
                        >
                          <Delete size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </PageContainer>
  );
};

export default TransactionsPage;
