"use client";
import { useEffect, useState } from "react";
import { createAccount, getAccounts } from "@/actions/account";
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
  Stack,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

export default function PlanContablePage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);

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
    // Lógica para abrir el modal de creación
    console.log("Open create modal for parentId:", parentId);
    setOpen(true);
  };

  const openEditModal = (account: Account) => {
    // Lógica para abrir el modal de edición
    console.log("Open edit modal for account:", account);
  };

  const confirmDelete = (account: Account) => {
    // Lógica para confirmar y eliminar la cuenta
    console.log("Confirm delete for account:", account);
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateAccount>();

  const onSubmit = async (data: CreateAccount) => {
    // Lógica para crear una nueva cuenta
    console.log("Creating account with data:", data);

    await createAccount(session!.user!.tenantId!, data);
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
        maxWidth="sm"
      >
        <DialogTitle>Crear Cuenta</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
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
                  margin="normal"
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
                  margin="normal"
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
                  margin="normal"
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
