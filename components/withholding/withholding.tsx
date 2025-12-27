"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  WithholdingCreate,
  WithholdingCreateSchema,
} from "@/lib/validations/withholding/withholding";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Plus, Trash, Save, Import } from "lucide-react";
import { $Enums } from "@/prisma/generated/prisma";
import { WithholdingCode } from "@/lib/validations/withholding/withholding-code";
import { notifyInfo, notifyError } from "@/lib/notifications";

import {
  createWithholding,
  updateWithholding,
  getWithholding,
} from "@/actions/withholding/withholding";

import { DocumentFiscalInfo } from "../document/DocumentFiscalInfo";
import { useSession } from "next-auth/react";
import { CreateDocumentFiscalInfo } from "@/lib/validations/document/document-fiscal-info";

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

const emptyDetail: any = {
  id: "",
  tenantId: "",
  withholdingId: "",
  codeId: "",
  type: "IVA",
  baseAmount: 0,
  percentage: 0,
  withheldAmount: 0,
  accountId: null,
};

export type WithholdingFormProps = {
  withholdingCodes: WithholdingCode[];
  entityType: "CUSTOMER" | "SUPPLIER";
  documentId: string; // 👈 factura base
  withholdingId?: string;
};

export const WithholdingForm: React.FC<WithholdingFormProps> = ({
  withholdingCodes,
  entityType,
  documentId,
  withholdingId,
}) => {
  const { data: session } = useSession();

  const methods = useForm<WithholdingCreate>({
    resolver: zodResolver(WithholdingCreateSchema),
    defaultValues: {
      documentId,
      issueDate: new Date(),
      totalWithheld: 0,
      details: [emptyDetail],
      document: {
        id: "",
        tenantId: "",
        entityType: entityType,
        documentType: $Enums.DocumentType.WITHHOLDING,
        status: "DRAFT",
        number: "",
        authorizationNumber: null,
        authorizedAt: null,
        issueDate: new Date(),
        subtotal: 0,
        taxTotal: 0,
        discount: 0,
        total: 0,
        paidAmount: 0,
        balance: 0,
        relatedDocumentId: null,
        fiscalInfo: entityType === "CUSTOMER" ? null : initialFiscalInfoState,
      },
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "details",
  });

  /* ================= cargar si existe ================= */
  useEffect(() => {
    if (!withholdingId) return;

    const load = async () => {
      const res = await getWithholding(withholdingId);
      if (res.success && res.data) {
        reset(res.data);
      }
    };

    load();
  }, [withholdingId, reset]);

  /* ================= total ================= */
  const details = watch("details");

  useEffect(() => {
    const total = (details || []).reduce(
      (sum, d) => sum + Number(d.withheldAmount || 0),
      0
    );
    setValue("totalWithheld", total);
  }, [details, setValue]);

  /* ================= submit ================= */
  const onSubmit = async (data: WithholdingCreate) => {
    try {
      if (!session?.user?.tenantId) return;

      const saveData = {
        ...data,
        id: withholdingId ?? undefined,
      };

      const res = withholdingId
        ? await updateWithholding(withholdingId, saveData)
        : await createWithholding(session.user.tenantId, documentId, saveData);

      if (!res.success) {
        notifyError(res.error || "Error al guardar retención");
        return;
      }

      notifyInfo("Retención guardada correctamente");
    } catch {
      notifyError("Error inesperado al guardar retención");
    }
  };

  // Observe
  const fiscalInfo = watch("document.fiscalInfo");

  /* ================= UI ================= */
  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* ================= Cabecera ================= */}
        {/* {JSON.stringify(errors)} */}
        <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Datos de la retención</h3>
            <Button type="button" variant="secondary" size="sm">
              <Import className="mr-2 h-4 w-4" />
              Importar XML
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              control={control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de emisión</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      required
                      value={
                        field.value
                          ? new Date(field.value).toISOString().slice(0, 10)
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {entityType === "CUSTOMER" && (
              <>
                <FormField
                  control={control}
                  name="document.number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input
                          required
                          placeholder="000-000-000000000"
                          {...field}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="document.authorizationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nro. autorización SRI</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          required
                          placeholder="0000000000000000000000000000000000000000000000000"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="document.authorizedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha autorización</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value).toISOString().slice(0, 10)
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {entityType === "SUPPLIER" && (
            <DocumentFiscalInfo
              documentType={
                (watch("document.documentType") as $Enums.DocumentType) ||
                $Enums.DocumentType.INVOICE
              }
              modeEdit={!!withholdingId}
              value={{
                establishmentId: fiscalInfo?.establishmentId || "",
                emissionPointId: fiscalInfo?.emissionPointId || "",
                sequence: fiscalInfo?.sequence || 0,
              }}
              onChange={(vals) => {
                if (!withholdingId) {
                  setValue("document.fiscalInfo", {
                    ...fiscalInfo,
                    ...vals,
                    sriStatus: fiscalInfo?.sriStatus || "DRAFT",
                    environment: fiscalInfo?.environment || "TEST",
                    documentId: fiscalInfo?.documentId || "",
                  });
                }
              }}
            />
          )}
        </div>

        {/* ================= Detalles ================= */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Detalles de retención</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ ...emptyDetail })}
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
                      name={`details.${idx}.codeId`}
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
                                  `details.${idx}.type`,
                                  code.type as $Enums.WithholdingType
                                );
                                setValue(
                                  `details.${idx}.percentage`,
                                  code.percentage
                                );
                                setValue(
                                  `details.${idx}.accountId`,
                                  code.accountId
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
                      name={`details.${idx}.type`}
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
                      name={`details.${idx}.baseAmount`}
                      render={({ field }) => (
                        <Input
                          type="number"
                          className="text-right"
                          {...field}
                          onChange={(e) => {
                            const base = Number(e.target.value);
                            field.onChange(base);
                            const pct =
                              Number(watch(`details.${idx}.percentage`)) || 0;
                            setValue(
                              `details.${idx}.withheldAmount`,
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
                      name={`details.${idx}.percentage`}
                      render={({ field }) => (
                        <Input
                          type="number"
                          className="text-right"
                          {...field}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            field.onChange(pct);
                            const base =
                              Number(watch(`details.${idx}.baseAmount`)) || 0;
                            setValue(
                              `details.${idx}.withheldAmount`,
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
                      name={`details.${idx}.withheldAmount`}
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
                  {watch("totalWithheld")?.toFixed(2)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* ================= Acciones ================= */}
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={handleSubmit(onSubmit)} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Guardar retención
          </Button>
        </div>
      </div>
    </FormProvider>
  );
};
