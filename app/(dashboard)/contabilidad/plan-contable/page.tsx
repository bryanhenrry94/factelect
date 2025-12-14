"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Controller, useForm } from "react-hook-form";

import {
  createAccount,
  deleteAccount,
  getAccounts,
  updateAccount,
} from "@/actions/accounting/chart-of-account";

import PageContainer from "@/components/container/PageContainer";
import { TreeTable } from "./TreeTable";
import { ChartOfAccount, CreateChartOfAccount } from "@/lib/validations";

import { notifyError, notifyInfo } from "@/lib/notifications";

/* ShadCN */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function PlanContablePage() {
  const { data: session } = useSession();

  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [open, setOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<ChartOfAccount | null>(
    null
  );

  /* ---------------------- */
  /* Form */
  /* ---------------------- */
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateChartOfAccount>({
    defaultValues: {
      code: "",
      name: "",
      accountType: "ASSET",
      parentId: null,
    },
  });

  /* ---------------------- */
  /* Fetch accounts */
  /* ---------------------- */
  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchAccounts();
    }
  }, [session?.user?.tenantId]);

  const fetchAccounts = async () => {
    if (!session?.user?.tenantId) return;

    const response = await getAccounts(session.user.tenantId);
    if (response.success) {
      setAccounts(response.data || []);
    }
  };

  /* ---------------------- */
  /* Modals */
  /* ---------------------- */
  const openCreateModal = (parentId: string | null) => {
    setAccountToEdit(null);
    reset({
      code: "",
      name: "",
      accountType: "ASSET",
      parentId,
    });
    setOpen(true);
  };

  const openEditModal = (account: ChartOfAccount) => {
    setAccountToEdit(account);
    reset({
      code: account.code,
      name: account.name,
      accountType: account.accountType,
      parentId: account.parentId,
    });
    setOpen(true);
  };

  /* ---------------------- */
  /* Delete */
  /* ---------------------- */
  const confirmDelete = async (account: ChartOfAccount) => {
    const ok = await ConfirmDialog.confirm(
      "Aviso",
      `¿Está seguro de que desea eliminar la cuenta "${account.name}"? Esta acción no se puede deshacer.`,
      "Eliminar",
      "Cancelar"
    );

    if (!ok) return;

    await deleteAccount(account.id);
    notifyInfo("Cuenta eliminada correctamente");
    fetchAccounts();
  };

  /* ---------------------- */
  /* Submit */
  /* ---------------------- */
  const onSubmit = async (data: CreateChartOfAccount) => {
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

  /* ---------------------- */
  /* UI */
  /* ---------------------- */
  return (
    <PageContainer title="Plan Contable">
      <TreeTable
        accounts={accounts}
        onCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={confirmDelete}
      />

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {accountToEdit ? "Editar cuenta" : "Crear cuenta"}
            </DialogTitle>
            <DialogDescription>
              Complete el formulario para registrar una cuenta contable.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Código */}
            <div className="space-y-1">
              <Label>Código</Label>
              <Controller
                name="code"
                control={control}
                rules={{ required: "El código es obligatorio" }}
                render={({ field }) => <Input {...field} />}
              />
              {errors.code && (
                <p className="text-xs text-red-500">{errors.code.message}</p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: "El nombre es obligatorio" }}
                render={({ field }) => <Input {...field} />}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-1">
              <Label>Tipo de cuenta</Label>
              <Controller
                name="accountType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSET">Activo</SelectItem>
                      <SelectItem value="LIABILITY">Pasivo</SelectItem>
                      <SelectItem value="EQUITY">Patrimonio</SelectItem>
                      <SelectItem value="INCOME">Ingreso</SelectItem>
                      <SelectItem value="EXPENSE">Gasto</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {accountToEdit ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
