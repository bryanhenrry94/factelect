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
  Paper,
} from "@mui/material";
import { Edit, Delete, Users, Plus } from "lucide-react";
import { useSession } from "next-auth/react";

import { deletePerson } from "@/app/actions/person";
import { AlertService } from "@/lib/alerts";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Account,
  CreateAccount,
  createAccountSchema,
  Movement,
} from "@/lib/validations";
import { getAccounts, getMovements } from "@/app/actions";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountFormDialog } from "@/components/account/AccountFormDialog";
import { AccountCard } from "@/components/account/AccountCard";
import { getMovementTypeLabel } from "@/utils/movement";

const initialState: CreateAccount = {
  name: "",
  type: "BANK",
  currency: "USD",
  bank: null,
  number: null,
  last4: null,
};

export default function MovementsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountSelected, setAccountSelected] = useState<Account | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    router.push(`/transacciones/editar/${movement.id}`);
  };

  const handleDelete = (personId: string) => {
    AlertService.showConfirm(
      "Aviso",
      "¿Estás seguro de que deseas eliminar esta transacción?",
      "Eliminar",
      "Cancelar"
    ).then(async (confirmed) => {
      if (confirmed) {
        // Lógica para eliminar la transacción
        await deletePerson(personId);
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
        <Button variant="contained" startIcon={<Plus />} onClick={handleOpen}>
          Nueva Cuenta
        </Button>
      </Box>

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
        </Grid>
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
                      <strong>Descripción</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Referencia</strong>
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
                      <TableCell>{movement.description}</TableCell>
                      <TableCell>{movement.reference}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* </TableContainer> */}
            </Box>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
