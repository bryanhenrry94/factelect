"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { notifyError, notifyInfo } from "@/lib/notifications";

import {
  CreateDocument,
  createDocumentSchema,
  DocumentResponse,
} from "@/lib/validations";
import { PersonInput } from "@/lib/validations/person/person";
import { CreateDocumentFiscalInfo } from "@/lib/validations/document/document-fiscal-info";

import {
  createDocument,
  DocumentFilter,
  getDocument,
  getDocuments,
  getPersonsByTenant,
  updateDocument,
} from "@/actions";
import { $Enums } from "@/prisma/generated/prisma";
import { ConfirmDialog } from "../ConfirmDialog";
import { WithholdingCode } from "@/lib/validations/withholding/withholding-code";
import { getWithholdingByDocumentId } from "@/actions/withholding/withholding";
import { useSession } from "next-auth/react";
import { PersonFilter } from "@/types";
import { getAllWithholdingCodes } from "@/actions/withholding/withholding-code";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { DocumentFiscalInfo } from "./DocumentFiscalInfo";
import { PersonSelectField } from "../forms/PersonSelectField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Plus, Save, Trash, Wheat } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { WithholdingDetailCreate } from "@/lib/validations/withholding/withholding-detail";
import StatusLabel from "./StatusLabel";

const emptyDetail: WithholdingDetailCreate = {
  codeId: "",
  type: "IVA",
  baseAmount: 0,
  percentage: 0,
  withheldAmount: 0,
  accountId: null,
};

const initialFiscalInfoState: CreateDocumentFiscalInfo = {
  documentId: "",
  establishmentId: "",
  emissionPointId: "",
  sequence: 0,
  accessKey: "",
  authorization: "",
  authorizationDate: new Date(),
  sriStatus: "DRAFT",
  environment: "TEST",
  generatedXmlUrl: "",
  authorizedXmlUrl: "",
  pdfUrl: "",
};

const initialState: CreateDocument = {
  personId: "",
  issueDate: new Date(),
  entityType: $Enums.EntityType.SUPPLIER,
  documentType: $Enums.DocumentType.WITHHOLDING,
  status: $Enums.DocumentStatus.DRAFT,
  subtotal: 0,
  taxTotal: 0,
  discount: 0,
  total: 0,
  paidAmount: 0,
  totalWithheld: 0,
  balance: 0,
  description: undefined,
  items: null,
  fiscalInfo: null,
  withholding: {
    id: "",
    documentId: "",
    issueDate: new Date(),
    totalWithheld: 0,
    details: [emptyDetail],
  },
};

interface WithholdingFormProps {
  documentId?: string;
}

export const WithholdingForm: React.FC<WithholdingFormProps> = ({
  documentId,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const params = useSearchParams();

  const documentIdFromParams = params.get("documentId") || null;

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [document, setDocument] = useState<DocumentResponse | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [modeEdit, setModeEdit] = useState(!!documentId);

  // state
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [withholdingCodes, setWithholdingCodes] = useState<WithholdingCode[]>(
    []
  );

  const methods = useForm<CreateDocument>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: initialState,
  });

  const {
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "withholding.details",
  });

  // observe
  const selectedPersonId = watch("personId");
  const fiscalInfo = watch("fiscalInfo");
  const entityType = watch("entityType");
  const details = watch("withholding.details");
  const relatedId = watch("relatedDocumentId");

  useEffect(() => {
    if (relatedId) {
      setValue("relatedDocumentId", relatedId);
      handleChangeDocument(relatedId);
    }
  }, [relatedId]);

  useEffect(() => {
    const total = (details || []).reduce(
      (sum, d) => sum + Number(d.withheldAmount || 0),
      0
    );
    setValue("withholding.totalWithheld", total);
  }, [details, setValue]);

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const fetchData = async () => {
      const filter: PersonFilter = {
        tenantId: session.user.tenantId,
        isCustomer: entityType === "CUSTOMER" ? true : undefined,
        isSupplier: entityType === "SUPPLIER" ? true : undefined,
      };

      const [clients, withholdingCodesRes] = await Promise.all([
        getPersonsByTenant(filter),
        getAllWithholdingCodes(session.user.tenantId),
      ]);

      if (clients.success) setPersons(clients.data);
      if (withholdingCodesRes.success)
        setWithholdingCodes(withholdingCodesRes.data);
    };

    fetchData();
  }, [session?.user?.tenantId, entityType]);

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  useEffect(() => {
    if (documentIdFromParams) {
      const loadBaseDocument = async () => {
        try {
          const res = await getDocument(documentIdFromParams);
          if (!res.success || !res.data) {
            return notifyError("Error al cargar documento base");
          }

          // set document info
          const newState: CreateDocument = {
            ...initialState,
            personId: res.data.personId,
            issueDate: new Date(),
            entityType: res.data.entityType,
            documentType: $Enums.DocumentType.WITHHOLDING,
            description: `Retención por documento ${res.data.number}`,
            relatedDocumentId: res.data.id,
          };
          reset(newState);

          setDocument(res.data);
        } catch {
          notifyError("Error al cargar documento base");
        }
      };

      loadBaseDocument();
    }
  }, [documentIdFromParams]);

  const loadDocument = async () => {
    try {
      const res = await getDocument(documentId!);
      if (!res.success || !res.data) {
        return notifyError("Error al cargar documento");
      }

      const resDocWithholding = await getWithholdingByDocumentId(res.data.id!);

      const docsRes = await getDocuments({
        tenantId: res.data.tenantId,
        personId: res.data.personId,
        documentType: res.data.documentType,
        entityType: res.data.entityType,
        withoutWithholding: false,
      });

      if (docsRes.success && docsRes.data) {
        setDocuments(docsRes.data);
      } else {
        setDocuments([]);
      }

      // ✅ AHORA que ya tienes documentos, resetea el form
      reset({
        ...res.data,
        relatedDocumentId: res.data.relatedDocumentId ?? "", // string, no null
        fiscalInfo: res.data.documentFiscalInfo ?? initialFiscalInfoState,
        withholding: resDocWithholding.data,
      });

      setModeEdit(true);
    } catch {
      notifyError("Error al cargar documento");
    }
  };

  const handleAddPerson = () => {
    router.push("/personas/nuevo");
  };

  const onSubmit = async (data: CreateDocument) => {
    try {
      if (!session?.user.tenantId) return;

      const confirm = await ConfirmDialog.confirm(
        "Confirmación",
        `Esta acción ${modeEdit ? "actualizará" : "creará"} el documento`
      );
      if (!confirm) return;

      const res = modeEdit
        ? await updateDocument(documentId!, data)
        : await createDocument(session.user.tenantId, data);

      if (!res?.success) {
        setError(res?.error || "Error al guardar documento");
        return;
      }

      notifyInfo(
        `Documento ${modeEdit ? "actualizado" : "creado"} correctamente`
      );
      router.push(`/retenciones/${res.data?.id}/editar`);
    } catch {
      setError("Error inesperado al guardar");
    }
  };

  const fetchDocuments = async () => {
    try {
      if (!session?.user?.tenantId) return;

      if (!selectedPersonId) return;

      const isNew = !documentId;

      const params: DocumentFilter = {
        tenantId: session.user.tenantId,
        personId: selectedPersonId || "",
        documentType: $Enums.DocumentType.INVOICE,
        entityType,
        withoutWithholding: isNew, // nuevo: solo sin retención | editar: todos
      };

      const response = await getDocuments(params);

      if (!response.success || !response.data) {
        setDocuments([]);
        return;
      }

      setDocuments(response.data);
    } catch (error) {
      console.error("Error loading documents", error);
      setDocuments([]);
    }
  };

  const handleChangeDocument = async (documentId: string) => {
    const response = await getDocument(documentId);
    if (response.success && response.data) {
      setDocument(response.data);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [session?.user.tenantId, entityType, selectedPersonId]);

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedPersonId),
    [persons, selectedPersonId]
  );

  return (
    <FormProvider {...methods}>
      {/* {JSON.stringify(errors)} */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          {/* STATUS */}
          <StatusLabel status={watch("status")} />

          {/* ACTIONS */}
          <div className="flex flex-wrap items-center gap-2">
            {/* SAVE */}
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {modeEdit ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {modeEdit ? "Editar Retención" : "Nueva Retención"}
            </CardTitle>
            <CardDescription>
              {modeEdit
                ? "Modifique la información de tu retención."
                : "Registra una nueva retención."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errors && Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Errores en el formulario</AlertTitle>
                <AlertDescription>
                  Por favor revise los campos marcados en rojo.
                  {JSON.stringify(errors)}
                </AlertDescription>
              </Alert>
            )}

            {/* ===================== DATOS GENERALES ===================== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fecha */}
              <FormField
                control={control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de emisión</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={modeEdit}
                        value={
                          field.value
                            ? new Date(field.value)
                                .toISOString()
                                .substring(0, 10)
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo Entidad */}
              <FormField
                control={control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      disabled={modeEdit}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Cliente / Proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Cliente</SelectItem>
                        <SelectItem value="SUPPLIER">Proveedor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ===================== PERSONA ===================== */}
              <PersonSelectField
                control={control}
                name="personId"
                label={entityType === "CUSTOMER" ? "Cliente" : "Proveedor"}
                persons={persons}
                selectedPerson={selectedPerson}
                onAddPerson={handleAddPerson}
              />
            </div>

            {/* ===================== INFO FISCAL ===================== */}
            {entityType === "SUPPLIER" && (
              <div className="mt-4">
                <DocumentFiscalInfo
                  documentType={
                    (watch("documentType") as $Enums.DocumentType) ||
                    $Enums.DocumentType.WITHHOLDING
                  }
                  modeEdit={modeEdit}
                  value={{
                    establishmentId: fiscalInfo?.establishmentId || "",
                    emissionPointId: fiscalInfo?.emissionPointId || "",
                    sequence: fiscalInfo?.sequence || 0,
                  }}
                  onChange={(vals) => {
                    if (!modeEdit) {
                      setValue("fiscalInfo", {
                        ...fiscalInfo,
                        ...vals,
                        sriStatus: fiscalInfo?.sriStatus || "DRAFT",
                        environment: fiscalInfo?.environment || "TEST",
                        documentId: fiscalInfo?.documentId || "",
                      });
                    }
                  }}
                />
              </div>
            )}

            {entityType === "CUSTOMER" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <FormField
                  control={control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de documento</FormLabel>
                      <Input
                        placeholder="000-000-000000000"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="authorizationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de autorización</FormLabel>
                      <Input
                        placeholder="0000000000000000000000000000000000000000000000000"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="authorizedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de autorización</FormLabel>
                      <Input
                        type="date"
                        value={
                          field.value
                            ? new Date(field.value)
                                .toISOString()
                                .substring(0, 10)
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="mt-4">
              <FormField
                control={control}
                name="relatedDocumentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento relacionado</FormLabel>
                    <Select
                      disabled={modeEdit}
                      value={field.value || ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleChangeDocument(value);
                      }}
                    >
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Seleccione documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.map((doc: DocumentResponse) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {`FACT ${doc.number}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {document && (
                <div className="mt-2 p-4 rounded-md border bg-muted text-sm space-y-1">
                  <div>
                    <span className="font-medium">Fecha de emisión:</span>{" "}
                    {document.issueDate
                      ? new Date(document.issueDate).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Base:</span>${" "}
                    {document.subtotal?.toFixed(2) ?? "0.00"}
                  </div>
                  <div>
                    <span className="font-medium">Impuestos:</span> $
                    {document.taxTotal?.toFixed(2) ?? "0.00"}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> $
                    {document.total?.toFixed(2) ?? "0.00"}
                  </div>
                  <div>
                    <span className="font-medium">Saldo:</span> $
                    {document.balance?.toFixed(2) ?? "0.00"}
                  </div>
                  {document.description && (
                    <div>
                      <span className="font-medium">Descripción:</span>{" "}
                      {document.description}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <FormField
                name="description"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descripción"
                        rows={3}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la retención</CardTitle>
            <CardDescription>
              Agregue los porcentajes de retención que conforman este documento.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Detalles de retención</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    append({
                      codeId: "",
                      type: "IVA",
                      baseAmount: 0,
                      percentage: 0,
                      withheldAmount: 0,
                      accountId: null,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-right">Retenido</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {fields.map((row, idx) => (
                    <TableRow key={row.id}>
                      {/* Código */}
                      <TableCell className="min-w-[220px]">
                        <FormField
                          control={control}
                          name={`withholding.details.${idx}.codeId`}
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  const code = withholdingCodes.find(
                                    (c) => c.id === val
                                  );

                                  if (code) {
                                    setValue(
                                      `withholding.details.${idx}.type`,
                                      code.type as $Enums.WithholdingType
                                    );
                                    setValue(
                                      `withholding.details.${idx}.percentage`,
                                      code.percentage
                                    );
                                    setValue(
                                      `withholding.details.${idx}.accountId`,
                                      code.accountId
                                    );

                                    if (code.type === "IVA") {
                                      setValue(
                                        `withholding.details.${idx}.baseAmount`,
                                        document?.taxTotal || 0
                                      );
                                    }

                                    if (code.type === "SOURCE") {
                                      setValue(
                                        `withholding.details.${idx}.baseAmount`,
                                        document?.subtotal || 0
                                      );
                                    }

                                    const baseAmount =
                                      Number(
                                        watch(
                                          `withholding.details.${idx}.baseAmount`
                                        )
                                      ) || 0;
                                    const pct = code.percentage;

                                    setValue(
                                      `withholding.details.${idx}.withheldAmount`,
                                      Number(
                                        ((baseAmount * pct) / 100).toFixed(2)
                                      )
                                    );
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Código" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {withholdingCodes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                      {c.code} - {c.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      {/* Tipo */}
                      <TableCell>
                        <FormField
                          control={control}
                          name={`withholding.details.${idx}.type`}
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={"IVA"}>IVA</SelectItem>
                                <SelectItem value={"SOURCE"}>Fuente</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>

                      {/* Base */}
                      <TableCell className="text-right">
                        <FormField
                          control={control}
                          name={`withholding.details.${idx}.baseAmount`}
                          render={({ field }) => (
                            <Input
                              type="number"
                              className="text-right"
                              {...field}
                              onChange={(e) => {
                                const base = Number(e.target.value);
                                field.onChange(base);
                                const pct =
                                  Number(
                                    watch(
                                      `withholding.details.${idx}.percentage`
                                    )
                                  ) || 0;
                                setValue(
                                  `withholding.details.${idx}.withheldAmount`,
                                  Number(((base * pct) / 100).toFixed(2))
                                );
                              }}
                            />
                          )}
                        />
                      </TableCell>

                      {/* % */}
                      <TableCell className="text-right">
                        <FormField
                          control={control}
                          name={`withholding.details.${idx}.percentage`}
                          render={({ field }) => (
                            <Input
                              type="number"
                              className="text-right"
                              {...field}
                              onChange={(e) => {
                                const pct = Number(e.target.value);
                                field.onChange(pct);
                                const base =
                                  Number(
                                    watch(
                                      `withholding.details.${idx}.baseAmount`
                                    )
                                  ) || 0;
                                setValue(
                                  `withholding.details.${idx}.withheldAmount`,
                                  Number(((base * pct) / 100).toFixed(2))
                                );
                              }}
                            />
                          )}
                        />
                      </TableCell>

                      {/* Retenido */}
                      <TableCell className="text-right font-medium">
                        <FormField
                          control={control}
                          name={`withholding.details.${idx}.withheldAmount`}
                          render={({ field }) => (
                            <Input
                              type="number"
                              className="text-right"
                              {...field}
                              readOnly
                            />
                          )}
                        />
                      </TableCell>

                      {/* Remove */}
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(idx)}
                          disabled={fields.length === 1}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total */}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-semibold">
                      Total retenido
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {watch("withholding.totalWithheld")?.toFixed(2)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormProvider>
  );
};
