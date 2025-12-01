"use client";
import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertService } from "@/lib/alerts";
import { useSession } from "next-auth/react";
import {
  BankAccount,
  CreateBankAccount,
  createBankAccountSchema,
} from "@/lib/validations/bank/bank_account";
import {
  createBankAccount,
  deleteBankAccount,
  getAllBankAccounts,
  updateBankAccount,
} from "@/actions/bank/bank-account";

const initialBankAccount: BankAccount = {
  id: "",
  tenantId: "",
  bankName: "",
  accountNumber: "",
  alias: null,
  type: "CURRENT",
  accountId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const BankAccountsPage = () => {
  const router = useRouter();
  const params = useSearchParams();

  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankSelected, setBankAccount] = useState<BankAccount | null>(null);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleOpen = () => {
    reset(initialBankAccount);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search); // actualiza el valor definitivo
    }, 300);

    return () => clearTimeout(handler); // limpia si sigue escribiendo
  }, [search]);

  const handleEdit = (account: BankAccount) => {
    setBankAccount(account);
    reset({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      alias: account.alias,
      type: account.type,
      accountId: account.accountId,
    });
    handleOpen();
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar la cuenta?"
    );
    if (!confirm) return;

    try {
      const result = await deleteBankAccount(id);

      if (result.success) {
        notifyInfo("Cuenta eliminada correctamente");
        fetchBankAccounts();
      } else notifyError("Error al eliminar la cuenta");
    } catch (error) {
      notifyError("Error al eliminar la cuenta");
    }
  };

  const fetchBankAccounts = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getAllBankAccounts(
        session.user.tenantId,
        debouncedSearch
      );
      if (!response.success) {
        notifyError("Error al cargar las categorías");
        return;
      }

      setBankAccounts(response.data || []);
    } catch (error) {
      notifyError("Error al cargar las categorías");
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, [session?.user?.tenantId, debouncedSearch]);

  useEffect(() => {
    updateParam("search", debouncedSearch);
  }, [debouncedSearch]);

  const updateParam = (key: string, value: string) => {
    const query = new URLSearchParams(params.toString());
    query.set(key, value);

    if (query.get("search") === "") {
      query.delete("search");
    }

    router.push(`/bancos/cuentas?${query.toString()}`);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBankAccount>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: initialBankAccount,
  });

  const onSubmit = async (data: CreateBankAccount) => {
    try {
      if (!session?.user?.tenantId) {
        notifyError("No se encontró el tenantId del usuario");
        return;
      }

      const response = bankSelected
        ? await updateBankAccount(bankSelected.id, data)
        : await createBankAccount(session.user.tenantId, data);

      if (response.success) {
        await notifyInfo(
          `Cuenta ${bankSelected ? "actualizada" : "creada"} correctamente`
        );
        fetchBankAccounts();
        handleClose();
        setBankAccount(null);
      } else {
        notifyError(
          `Error al ${bankSelected ? "actualizar" : "crear"} la cuenta`
        );
      }
    } catch (error) {
      console.log(error);
      notifyError("Error al guardar la cuenta");
    }
  };

  return (
    <PageContainer
      title="Cuentas Bancarias"
      description="Gestiona las cuentas bancarias de tu organización"
    >
      {/* Header */}
      <PageHeader title="Cuentas Bancarias" />

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
          label="Buscar cuentas"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            updateParam("search", e.target.value);
          }}
        />
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={handleOpen}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Agregar Cuenta
        </Button>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ShoppingBag />
              <Typography variant="h6" mt={2}>
                No hay cuentas aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agrega la primera cuenta bancaria
              </Typography>
            </Box>
          ) : (
            <Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Nombre</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Nro Cuenta</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Alias</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Tipo</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Acciones</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bankAccounts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((account) => (
                      <TableRow key={account.id} hover>
                        <TableCell>{account.bankName}</TableCell>
                        <TableCell>{account.accountNumber}</TableCell>
                        <TableCell>{account.alias}</TableCell>
                        <TableCell>{account.type}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(account)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                color="primary"
                count={bankAccounts.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[5]}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {bankSelected ? "Editar Cuenta" : "Agregar Cuenta"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {bankSelected
                ? "Actualizar información de la cuenta"
                : "Agregar una nueva cuenta a tu catálogo"}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tipo de Cuenta"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    error={errors.type ? true : false}
                    helperText={errors.type?.message}
                    value={field.value || ""}
                    select
                  >
                    <MenuItem value="CURRENT">Corriente</MenuItem>
                    <MenuItem value="SAVINGS">Ahorros</MenuItem>
                    <MenuItem value="CREDIT">Crédito</MenuItem>
                    <MenuItem value="OTHER">Otro</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="bankName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre de la Cuenta"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    error={errors.bankName ? true : false}
                    helperText={errors.bankName?.message}
                  />
                )}
              />
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número de Cuenta"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    error={errors.accountNumber ? true : false}
                    helperText={errors.accountNumber?.message}
                  />
                )}
              />
              <Controller
                name="alias"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Alias"
                    variant="outlined"
                    fullWidth
                    margin="dense"
                    value={field.value || ""}
                    error={errors.alias ? true : false}
                    helperText={errors.alias?.message}
                  />
                )}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Button onClick={handleClose}>Cancelar</Button>
                <Button variant="contained" type="submit">
                  Guardar
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </form>
      </Dialog>
    </PageContainer>
  );
};

export default BankAccountsPage;
