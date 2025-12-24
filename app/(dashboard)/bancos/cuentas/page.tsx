"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

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
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { ChartOfAccount } from "@/lib/validations";
import { useSearchFilter } from "@/hooks/useSearchFilter";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";

const initialBankAccount: BankAccount = {
  id: "",
  tenantId: "",
  bankName: "",
  accountNumber: "",
  type: "CURRENT",
  accountId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function BankAccountsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankSelected, setBankSelected] = useState<BankAccount | null>(null);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { search, setSearch } = useSearchFilter();

  const form = useForm<CreateBankAccount>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: initialBankAccount,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  /* ======================= */
  /* Fetch data */
  /* ======================= */

  const fetchBankAccounts = async () => {
    if (!session?.user?.tenantId) return;
    const res = await getAllBankAccounts(session.user.tenantId, search);
    if (!res.success) return notifyError("Error al cargar cuentas");
    setBankAccounts(res.data || []);
  };

  const fetchAccounts = async () => {
    if (!session?.user?.tenantId) return;
    const res = await getAccounts(session.user.tenantId);
    if (!res.success) return notifyError("Error al cargar cuentas contables");
    setAccounts(res.data || []);
  };

  useEffect(() => {
    fetchBankAccounts();
  }, [session?.user?.tenantId, search]);

  useEffect(() => {
    fetchAccounts();
  }, [session?.user?.tenantId]);

  /* ======================= */
  /* Actions */
  /* ======================= */

  const handleOpen = () => {
    reset(initialBankAccount);
    setBankSelected(null);
    setOpen(true);
  };

  const handleEdit = (account: BankAccount) => {
    setBankSelected(account);
    reset(account);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await ConfirmDialog.confirm(
      "Aviso",
      "¿Deseas eliminar la cuenta bancaria?"
    );
    if (!confirm) return;

    const res = await deleteBankAccount(id);
    if (res.success) {
      notifyInfo("Cuenta eliminada");
      fetchBankAccounts();
    } else notifyError("Error al eliminar");
  };

  const onSubmit = async (data: CreateBankAccount) => {
    if (!session?.user?.tenantId) return;

    const res = bankSelected
      ? await updateBankAccount(bankSelected.id, data)
      : await createBankAccount(session.user.tenantId, data);

    if (res.success) {
      notifyInfo(
        `Cuenta ${bankSelected ? "actualizada" : "creada"} correctamente`
      );
      setOpen(false);
      fetchBankAccounts();
    } else {
      notifyError("Error al guardar");
    }
  };

  /* ======================= */
  /* UI */
  /* ======================= */

  return (
    <PageContainer
      title="Cuentas Bancarias"
      description="Gestiona las cuentas bancarias de tu organización"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between mb-4">
        <Input
          placeholder="Buscar cuentas"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Button onClick={handleOpen}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-4">
          {bankAccounts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="mx-auto mb-2" />
              No hay cuentas registradas
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Nro Cuenta</TableHead>
                    <TableHead>Cuenta Contable</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.bankName}</TableCell>
                        <TableCell>{a.accountNumber}</TableCell>
                        <TableCell>
                          {accounts.find((c) => c.id === a.accountId)?.name}
                        </TableCell>
                        <TableCell>{a.type}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(a)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(a.id)}
                          >
                            <Delete className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={bankAccounts.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {bankSelected ? "Editar Cuenta" : "Nueva Cuenta"}
            </DialogTitle>
            <DialogDescription>
              {bankSelected
                ? "Modifica la información de la cuenta bancaria."
                : "Complete el formulario para crear una nueva cuenta bancaria."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* ======================= */}
              {/*   DATOS DE LA CUENTA     */}
              {/* ======================= */}
              <FieldGroup>
                <FieldGroup>
                  {/* Tipo */}
                  <FormField
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de cuenta</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione el tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CURRENT">Corriente</SelectItem>
                              <SelectItem value="SAVINGS">Ahorros</SelectItem>
                              <SelectItem value="CREDIT">Crédito</SelectItem>
                              <SelectItem value="OTHER">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nombre */}
                  <FormField
                    control={control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la cuenta</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Banco Pichincha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Número */}
                  <FormField
                    control={control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de cuenta</FormLabel>
                        <FormControl>
                          <Input placeholder="0123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="accountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cuenta contable</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start"
                              >
                                {accounts.find((a) => a.id === field.value)
                                  ?.name ?? "Seleccionar cuenta contable"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[300px]">
                              <Command>
                                <CommandInput placeholder="Buscar cuenta..." />
                                <CommandEmpty>No hay resultados</CommandEmpty>
                                <CommandGroup>
                                  {accounts.slice(0, 10).map((a) => (
                                    <CommandItem
                                      key={a.id}
                                      onSelect={() => field.onChange(a.id)}
                                    >
                                      {a.code} — {a.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormDescription>
                          Relaciona esta cuenta bancaria con el plan de cuentas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FieldGroup>
                <FieldSeparator />
              </FieldGroup>

              {/* ======================= */}
              {/*        ACCIONES         */}
              {/* ======================= */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Guardar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
