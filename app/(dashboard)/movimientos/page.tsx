"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
  TextField,
  Grid,
  useTheme,
  TableContainer,
} from "@mui/material";
import { Edit, Delete, Users, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

import { deletePerson } from "@/app/actions/person";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Account, Movement } from "@/lib/validations";
import { deleteTransaction, getAccounts, getMovements } from "@/app/actions";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useRouter } from "next/navigation";
import { AccountFormDialog } from "@/components/account/AccountFormDialog";
import { AccountCard } from "@/components/account/AccountCard";
import { getMovementTypeLabel } from "@/utils/movement";

export default function MovementsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountSelected, setAccountSelected] = useState<Account | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAccountSelected(null);
  };

  const loadMovements = useCallback(async () => {
    if (!session?.user?.tenantId) return;

    const response = await getMovements(session.user.tenantId);
    console.log("Movements response:", response);
    if (response.success) {
      setMovements(response.data || []);
    } else {
      setMovements([]);
    }
  }, [session?.user?.tenantId]);

  const loadAccounts = useCallback(async () => {
    if (!session?.user?.tenantId) return;

    const response = await getAccounts(session.user.tenantId);
    if (response.success) {
      setAccounts(response.data || []);
    } else {
      setAccounts([]);
    }
  }, [session?.user?.tenantId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const handleEdit = (movement: Movement) => {
    router.push(`/transacciones/${movement.id}/editar`);
  };

  const handleDelete = (transactionId: string) => {
    AlertService.showConfirm(
      "Aviso",
      "¿Estás seguro de que deseas eliminar esta transacción?",
      "Eliminar",
      "Cancelar"
    ).then(async (confirmed) => {
      if (confirmed) {
        // Lógica para eliminar la transacción
        await deleteTransaction(transactionId);
        AlertService.showSuccess("Transacción eliminada exitosamente.");
        await loadMovements();
      }
    });
  };

  const onAccountCreatedOrUpdated = async () => {
    await loadAccounts();
    handleClose();
  };

  const handleAccountSelected = (account: Account) => {
    setAccountSelected(account);
  };

  const handleAccountEdit = (account: Account) => {
    setAccountSelected(account);
    setOpen(true);
  };

  return (
    <PageContainer
      title="Movimientos de Cuenta"
      description="Administra los movimientos de tu aplicación"
    >
      {/* HEADER */}
      <PageHeader title="Movimientos de Cuenta" />

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        {/* Aquí puedes agregar componentes de filtro si es necesario */}
        {accounts.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No hay cuentas disponibles para filtrar.
          </Typography>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {accounts.map((account) => (
            <Grid size={{ xs: 6, md: 3 }} key={account.id}>
              <AccountCard
                account={account}
                onSelected={handleAccountSelected}
                onEdit={handleAccountEdit}
              />
            </Grid>
          ))}
          <Grid size={{ xs: 6, md: 3 }}>
            <Card
              variant="outlined"
              onClick={handleOpen}
              sx={{
                mb: 2,
                borderRadius: 3,
                cursor: "pointer",
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                borderStyle: "dashed",
                transition: "all 0.25s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.action.hover,
                },
                height: "90%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 140,
              }}
            >
              <CardContent
                sx={{
                  p: 2,
                  pb: 2.5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <Plus size={32} color={theme.palette.primary.main} />
                <Typography
                  variant="body2"
                  color="primary"
                  fontWeight={500}
                  textAlign="center"
                >
                  Agregar Nueva Cuenta
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <TextField label="Buscar movimientos" variant="outlined" size="small" />
        {/* <Button variant="contained" startIcon={<Plus />} onClick={handleOpen}>
          Registrar Movimiento
        </Button> */}
      </Box>

      {/* DIALOGO FORMULARIO */}
      <AccountFormDialog
        id={accountSelected?.id}
        open={open}
        handleClose={handleClose}
        initialData={accountSelected}
        onSuccess={onAccountCreatedOrUpdated}
      />

      {/* TABLA */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          {movements.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Users />
              <Typography variant="h6" mt={2}>
                No hay movimientos aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega el primer movimiento
              </Typography>
            </Box>
          ) : (
            <Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Tipo de Movimiento</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Valor</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Fecha Movimiento</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Cuenta</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Acción</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow
                        key={movement.id}
                        hover
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell>
                          {getMovementTypeLabel(movement.type)}
                        </TableCell>
                        <TableCell>
                          <Typography
                            color={movement.type === "IN" ? "green" : "red"}
                          >
                            {formatCurrency(movement.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDate(movement.date.toString())}
                        </TableCell>
                        <TableCell>{movement.accountId}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              aria-label="Editar"
                              size="small"
                              onClick={() => handleEdit(movement)}
                              color="primary"
                            >
                              <Edit size={18} />
                            </IconButton>

                            <IconButton
                              aria-label="Eliminar"
                              size="small"
                              onClick={() => handleDelete(movement.id || "")}
                              color="error"
                            >
                              <Delete size={18} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
