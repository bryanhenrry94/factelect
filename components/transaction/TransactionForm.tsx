"use client";
import {
  Box,
  Alert,
  Stack,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import HeaderActions from "./HeaderActions";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useTenant from "@/hooks/useTenant";
import { AlertService } from "@/lib/alerts";
import { useRouter } from "next/navigation";
import {
  ChartOfAccount,
  CreateTransactionInput,
  createTransactionSchema,
} from "@/lib/validations";
import {
  createTransaction,
  getPersonsByTenant,
  getTransaction,
  updateTransaction,
} from "@/actions";
import TabPanel from "../ui/TabPanel";
import DocumentTable from "./DocumentTable";
import { paymentMethodsIncome } from "@/utils/paymentMethods";
import { PersonInput } from "@/lib/validations/person";
import { PersonFilter } from "@/types/person";
import { useSession } from "next-auth/react";
import { notifyError, notifyInfo } from "@/lib/notifications";

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
  setError?: (error: string | null) => void;
}

export default function TransactionForm({
  transactionId,
  setError,
}: TransactionFormProps) {
  const { data: session } = useSession();
  const [modeEdit, setModeEdit] = useState<boolean>(!!transactionId);
  const [tabValue, setTabValue] = useState(0);
  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const router = useRouter();

  const { tenant } = useTenant();

  const handleTabChange = (_: any, newValue: number) => setTabValue(newValue);

  const methods = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: initialState,
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = methods;

  useEffect(() => {
    if (!transactionId) return;

    loadInvoice();
  }, [transactionId, reset]);

  useEffect(() => {
    loadPersons("CLIENT");
  }, [session?.user?.tenantId]);

  const loadPersons = async (role: string) => {
    if (!session?.user?.tenantId) return;

    setValue("personId", "");

    const filter: PersonFilter = {
      tenantId: session.user.tenantId,
      role: role as "CLIENT" | "SUPPLIER",
    };

    const response = await getPersonsByTenant(filter);

    if (response.success && response.data) {
      setPersons(response.data);
    }
  };

  const handleChangeType = (type: string) => {
    const role = type === "INCOME" ? "CLIENT" : "SUPPLIER";
    loadPersons(role);
  };

  const loadInvoice = async () => {
    try {
      if (!transactionId) return;

      const response = await getTransaction(transactionId);

      if (response.success && response.data) {
        setModeEdit(true);

        const data: CreateTransactionInput = {
          personId: response.data.personId,
          type: response.data.type,
          method: response.data.method,
          amount: response.data.amount,
          issueDate: response.data.issueDate,
          reference: response.data.reference,
          description: response.data.description,
          documents: response.data.documents,
          reconciled: response.data.reconciled ?? false,
          reconciledAt: response.data.reconciledAt ?? null,
          bankAccountId: response.data.bankAccountId ?? null,
          cashBoxId: response.data.cashBoxId ?? null,
        };

        reset(data);
      } else {
        notifyError("Error al cargar la transacción");
      }
    } catch (error) {
      notifyError("Error al cargar la transacción");
    }
  };

  const onSubmit = async (data: CreateTransactionInput) => {
    console.log("Transaction Data:", data);

    try {
      setError?.(null);

      const confirm = await AlertService.showConfirm(
        "Estas seguro de continuar?",
        `Esta acción ${modeEdit ? "actualizará" : "creará"} la transacción.`
      );
      if (!confirm) return;

      const response = modeEdit
        ? await updateTransaction(transactionId!, data)
        : await createTransaction(data, tenant.id ?? "");

      if (!response) {
        setError?.("Error al procesar la solicitud");
        return;
      }

      if (!response.success) {
        setError?.(
          response.error ||
            `Error al ${modeEdit ? "actualizar" : "crear"} la transacción`
        );
        return;
      }

      notifyInfo(
        `Transacción ${modeEdit ? "actualizada" : "creada"} exitosamente.`
      );

      if (!modeEdit) reset(initialState);
      router.push(`/transacciones`);
    } catch (err) {
      console.error(err);
      setError?.("Error al procesar la solicitud");
    }
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <HeaderActions modeEdit={modeEdit} />

        {/* {JSON.stringify(errors)} */}
        {Object.keys(errors).length > 0 && (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {Object.entries(errors).map(([field, error]: [string, any]) => (
              <Alert key={field} severity="error">
                <strong>{field}:</strong> {error.message}
              </Alert>
            ))}
          </Stack>
        )}

        {/* Form Fields Here */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mt: 2 }}>
              <Controller
                name="type"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Tipo de Transacción"
                    select
                    fullWidth
                    margin="dense"
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e);
                      handleChangeType(e.target.value);
                    }}
                    size="small"
                  >
                    <MenuItem value="INCOME">Ingreso</MenuItem>
                    <MenuItem value="EXPENSE">Egreso</MenuItem>
                  </TextField>
                )}
              />

              <Controller
                name="method"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Método de Pago"
                    select
                    fullWidth
                    margin="dense"
                    value={field.value || ""}
                    size="small"
                  >
                    {paymentMethodsIncome
                      .filter((method) => method.type.includes(watch("type")))
                      .map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                  </TextField>
                )}
              />

              <Controller
                name="issueDate"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fecha de Emisión"
                    type="date"
                    fullWidth
                    margin="dense"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split("T")[0]
                        : ""
                    }
                    size="small"
                  />
                )}
              />

              <Controller
                name="personId"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Persona"
                    fullWidth
                    margin="dense"
                    value={field.value || ""}
                    size="small"
                    select
                  >
                    {persons.map((person) => (
                      <MenuItem key={person.id} value={person.id}>
                        {`${person.firstName} ${person.lastName}`}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="reference"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Referencia"
                    fullWidth
                    margin="dense"
                    value={field.value || ""}
                    size="small"
                  />
                )}
              />

              <Controller
                name="description"
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Descripción"
                    fullWidth
                    margin="dense"
                    multiline
                    rows={4}
                    value={field.value || ""}
                    size="small"
                  />
                )}
              />

              {/* Add other fields similarly */}
            </Box>
          </Grid>
        </Grid>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Documentos" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {watch("type") === "INCOME" ? (
            <DocumentTable />
          ) : (
            <Typography>No hay documentos para mostrar.</Typography>
          )}
        </TabPanel>
      </Box>
    </FormProvider>
  );
}
