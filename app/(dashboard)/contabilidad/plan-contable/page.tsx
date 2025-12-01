"use client";
import { useEffect, useState } from "react";
import {
  createAccount,
  deleteAccount,
  getAccounts,
  updateAccount,
} from "@/actions/accounting/chart-of-account";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Account, CreateAccount } from "@/lib/validations";
import { useSession } from "next-auth/react";
import { TreeTable } from "./TreeTable";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { AlertService } from "@/lib/alerts";
import { notifyError, notifyInfo } from "@/lib/notifications";

export default function PlanContablePage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [session?.user?.tenantId]);

  const fetchAccounts = async () => {
    try {
      if (!session?.user?.tenantId) return;

      const response = await getAccounts(session.user.tenantId);
      if (response.success) {
        setAccounts(response.data || []);
      } else {
        console.error(response.error);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const openCreateModal = (parentId: string | null) => {
    setAccountToEdit(null);

    if (parentId) {
      console.log("Creating as child of:", parentId);
      reset({
        code: "",
        name: "",
        accountType: "ASSET",
        parentId: parentId,
      });
    } else {
      reset({
        code: "",
        name: "",
        accountType: "ASSET",
        parentId: null,
      });
    }

    setOpen(true);
  };

  const openEditModal = (account: Account) => {
    setAccountToEdit(account);
    reset({
      code: account.code,
      name: account.name,
      accountType: account.accountType,
      parentId: account.parentId,
    });

    setOpen(true);
  };

  const confirmDelete = async (account: Account) => {
    // Lógica para confirmar y eliminar la cuenta
    console.log("Confirm delete for account:", account);
    const confirmed = await AlertService.showConfirm(
      "Aviso",
      `¿Está seguro de que desea eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`
    );
    if (confirmed) {
      console.log("Account deleted:", account);
      await deleteAccount(account.id);
      notifyInfo("Cuenta eliminada correctamente");
      fetchAccounts();
      // Aquí iría la lógica para eliminar la cuenta
    } else {
      console.log("Account deletion cancelled");
    }
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAccount>();

  const onSubmit = async (data: CreateAccount) => {
    const response = accountToEdit
      ? await updateAccount(accountToEdit.id, data)
      : await createAccount(session!.user!.tenantId!, data);

    if (!response.success) {
      notifyError(
        accountToEdit
          ? "Error al actualizar la cuenta"
          : "Error al crear la cuenta"
      );
      return;
    }

    notifyInfo(
      accountToEdit
        ? "Cuenta actualizada correctamente"
        : "Cuenta creada correctamente"
    );
    setOpen(false);
    fetchAccounts();
  };

  return (
    <PageContainer title="Plan Contable">
      <PageHeader title="Plan Contable" />

      <TreeTable
        accounts={accounts}
        onCreate={(parentId) => openCreateModal(parentId)}
        onEdit={(acc) => openEditModal(acc)}
        onDelete={(acc) => confirmDelete(acc)}
      />

      {/* Create Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Crear Cuenta</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete el formulario para crear una nueva cuenta contable.
            </Typography>

            <Controller
              name="parentId"
              control={control}
              defaultValue={null}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Cuenta Padre (opcional)"
                  fullWidth
                  margin="dense"
                  size="small"
                  disabled
                  value={field.value || "Ninguna (Cuenta raíz)"}
                  select
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="code"
              control={control}
              defaultValue=""
              rules={{ required: "El código es obligatorio" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Código"
                  fullWidth
                  margin="dense"
                  size="small"
                  error={!!errors.code}
                  helperText={errors.code ? errors.code.message : ""}
                />
              )}
            />
            <Controller
              name="name"
              control={control}
              defaultValue=""
              rules={{ required: "El nombre es obligatorio" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nombre"
                  fullWidth
                  margin="dense"
                  size="small"
                  error={!!errors.name}
                  helperText={errors.name ? errors.name.message : ""}
                />
              )}
            />
            <Controller
              name="accountType"
              control={control}
              rules={{ required: "El tipo de cuenta es obligatorio" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Tipo de Cuenta"
                  fullWidth
                  margin="dense"
                  size="small"
                  error={!!errors.accountType}
                  helperText={
                    errors.accountType ? errors.accountType.message : ""
                  }
                  value={field.value || ""}
                >
                  <MenuItem value="ASSET">Activo</MenuItem>
                  <MenuItem value="LIABILITY">Pasivo</MenuItem>
                  <MenuItem value="EQUITY">Patrimonio</MenuItem>
                  <MenuItem value="INCOME">Ingreso</MenuItem>
                  <MenuItem value="EXPENSE">Gasto</MenuItem>
                </TextField>
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Crear
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </PageContainer>
  );
}
