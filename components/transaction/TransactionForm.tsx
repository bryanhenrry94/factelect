"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import HeaderActions from "./HeaderActions";
import DocumentTable from "./DocumentTable";

import useTenant from "@/hooks/useTenant";
import { AlertService } from "@/lib/alerts";
import { notifyError, notifyInfo } from "@/lib/notifications";

import {
  CreateTransactionInput,
  createTransactionSchema,
} from "@/lib/validations";
import {
  createTransaction,
  getPersonsByTenant,
  getTransaction,
  updateTransaction,
} from "@/actions";
import { paymentMethodsIncome } from "@/utils/paymentMethods";
import { PersonInput } from "@/lib/validations/person";
import { PersonFilter } from "@/types/person";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "../ui/field";
import { CashBox } from "@/lib/validations/cash/cash_box";
import { BankAccount } from "@/lib/validations/bank/bank_account";
import { ConfirmDialog } from "../ConfirmDialog";

const initialState: CreateTransactionInput = {
  personId: "",
  type: "INCOME",
  method: "CASH",
  amount: 0,
  issueDate: new Date(),
  reference: null,
  description: null,
  documents: [],
  reconciled: false,
  reconciledAt: null,
  bankAccountId: null,
  cashBoxId: null,
};

interface TransactionFormProps {
  transactionId?: string;
  clients?: any[];
  products?: any[];
  establishments?: any[];
  sriConfig?: any;
  setError?: (error: string | null) => void;
  cashBoxes?: CashBox[];
  bankAccounts?: BankAccount[];
}

export default function TransactionForm({
  transactionId,
  clients,
  products,
  establishments,
  sriConfig,
  setError,
  cashBoxes,
  bankAccounts,
}: TransactionFormProps) {
  const { data: session } = useSession();
  const { tenant } = useTenant();
  const router = useRouter();

  const [modeEdit, setModeEdit] = useState(!!transactionId);
  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [tab, setTab] = useState("documents");

  const methods = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: initialState,
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  /* -------------------- Load data -------------------- */

  useEffect(() => {
    if (transactionId) loadTransaction();
  }, [transactionId]);

  useEffect(() => {
    loadPersons("CLIENT");
  }, [session?.user?.tenantId]);

  const loadPersons = async (role: "CLIENT" | "SUPPLIER") => {
    if (!session?.user?.tenantId) return;

    setValue("personId", "");

    const filter: PersonFilter = {
      tenantId: session.user.tenantId,
      role,
    };

    const res = await getPersonsByTenant(filter);
    if (res.success && res.data) setPersons(res.data);
  };

  const loadTransaction = async () => {
    const res = await getTransaction(transactionId!);
    if (!res.success || !res.data) {
      notifyError("Error al cargar la transacción");
      return;
    }

    setModeEdit(true);
    reset({
      ...res.data,
      reconciled: res.data.reconciled ?? false,
      reconciledAt: res.data.reconciledAt ?? null,
      bankAccountId: res.data.bankAccountId ?? null,
      cashBoxId: res.data.cashBoxId ?? null,
    });
  };

  /* -------------------- Submit -------------------- */

  const onSubmit = async (data: CreateTransactionInput) => {
    try {
      setError?.(null);

      const confirm = await ConfirmDialog.confirm(
        "¿Estás seguro de continuar?",
        `Esta acción ${modeEdit ? "actualizará" : "creará"} la transacción.`
      );
      if (!confirm) return;

      const res = modeEdit
        ? await updateTransaction(transactionId!, data)
        : await createTransaction(data, tenant.id ?? "");

      if (!res?.success) {
        setError?.(res?.error || "Error al procesar la solicitud");
        return;
      }

      notifyInfo(
        `Transacción ${modeEdit ? "actualizada" : "creada"} exitosamente`
      );

      if (!modeEdit) reset(initialState);
      router.push("/transacciones");
    } catch {
      setError?.("Error al procesar la solicitud");
    }
  };

  /* -------------------- UI -------------------- */

  return (
    <FormProvider {...methods}>
      <FieldSet>
        <FieldLegend>
          {modeEdit ? "Editar Transacción" : "Nueva Transacción"}
        </FieldLegend>
        <FieldDescription>
          Completa la información general y luego asocia los documentos.
        </FieldDescription>
      </FieldSet>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              Revisa los campos obligatorios del formulario
            </AlertDescription>
          </Alert>
        )}

        <FieldGroup>
          <FieldTitle>Información general</FieldTitle>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo */}
            <Field>
              <FieldLabel>Tipo</FieldLabel>
              <Controller
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      loadPersons(v === "INCOME" ? "CLIENT" : "SUPPLIER");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME">Cobro</SelectItem>
                      <SelectItem value="EXPENSE">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Define si la transacción es un cobro o pago.
              </FieldDescription>
            </Field>

            {/* Método */}
            <Field>
              <FieldLabel>Método</FieldLabel>
              <Controller
                name="method"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethodsIncome
                        .filter((m) => m.type.includes(watch("type")))
                        .map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {watch("method") === "CASH" && (
              <Field>
                <FieldLabel>Caja</FieldLabel>
                <Controller
                  name="cashBoxId"
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una caja" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashBoxes?.map((cb: CashBox) => (
                          <SelectItem key={cb.id} value={cb.id}>
                            {cb.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}

            {watch("method") === "TRANSFER" && (
              <Field>
                <FieldLabel>Cuenta bancaria</FieldLabel>
                <Controller
                  name="bankAccountId"
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cuenta bancaria" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts?.map((ba: BankAccount) => (
                          <SelectItem key={ba.id} value={ba.id}>
                            {ba.bankName} - {ba.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}

            {/* Fecha */}
            <Field>
              <FieldLabel>Fecha</FieldLabel>
              <Controller
                name="issueDate"
                render={({ field }) => (
                  <Input
                    type="date"
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </Field>
          </div>
        </FieldGroup>

        <FieldGroup>
          <FieldTitle>Contraparte</FieldTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>
                {watch("type") === "INCOME" ? "Cliente" : "Proveedor"}
              </FieldLabel>
              <Controller
                name="personId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una persona" />
                    </SelectTrigger>
                    <SelectContent>
                      {persons.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field>
              <FieldLabel>Referencia</FieldLabel>
              <Controller
                name="reference"
                render={({ field }) => (
                  <Input
                    placeholder="Ej: Depósito, transferencia, comprobante #123"
                    {...field}
                    value={field.value || ""}
                  />
                )}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>Descripción</FieldLabel>
            <Controller
              name="description"
              render={({ field }) => (
                <Textarea
                  rows={3}
                  placeholder="Notas adicionales sobre la transacción"
                  {...field}
                  value={field.value || ""}
                />
              )}
            />
          </Field>
        </FieldGroup>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="documents">Documentos asociados</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="pt-4">
            {watch("type") === "INCOME" ? (
              <DocumentTable />
            ) : (
              <Alert>
                <AlertDescription>
                  Los egresos no requieren documentos asociados.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-0 bg-background border-t pt-4">
          <HeaderActions modeEdit={modeEdit} />
        </div>
      </form>
    </FormProvider>
  );
}
