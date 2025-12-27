"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import ItemsTable from "./ItemsTable";
import TotalsSection from "./invoice/TotalsSection";
import { PaymentMethodsTable } from "./invoice/PaymentMethodsTable";

import { notifyError, notifyInfo } from "@/lib/notifications";

import {
  CreateDocument,
  CreateDocumentItem,
  createDocumentSchema,
  Product,
} from "@/lib/validations";
import { PersonInput } from "@/lib/validations/person/person";
import { Warehouse } from "@/lib/validations/inventory/warehouse";

import {
  createDocument,
  getAllProducts,
  getDocument,
  getDocumentItems,
  getInvoiceDataForPDF,
  getPersonsByTenant,
  sendToSRI,
  updateDocument,
} from "@/actions";
import { getDocumentFiscalInfo } from "@/actions/document/document-fiscal-info";
import { getDocumentPayments } from "@/actions/document/document-payment";
import { $Enums } from "@/prisma/generated/prisma";
import { ConfirmDialog } from "./../ConfirmDialog";
import InvoicePDF from "./../pdf/InvoicePDF";
import { pdf } from "@react-pdf/renderer";
import { WithholdingView } from "./invoice/WithholdingView";
import { WithholdingCode } from "@/lib/validations/withholding/withholding-code";
import { getWithholdingByBaseDocument } from "@/actions/withholding/withholding";
import { Withholding } from "@/lib/validations/withholding/withholding";
import { useSession } from "next-auth/react";
import { PersonFilter } from "@/types";
import { getWarehouses } from "@/actions/inventory/warehouse";
import { getAllWithholdingCodes } from "@/actions/withholding/withholding-code";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./../ui/form";
import { Input } from "./../ui/input";

import { PersonSelectField } from "./../forms/PersonSelectField";
import { Button } from "../ui/button";
import { DollarSign, Save } from "lucide-react";

const initialItemsState: CreateDocumentItem[] = [
  {
    warehouseId: "",
    productId: "",
    quantity: 1,
    unitPrice: 0,
    tax: $Enums.TaxType.IVA_0,
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  },
];

const initialState: CreateDocument = {
  personId: "",
  issueDate: new Date(),
  entityType: $Enums.EntityType.SUPPLIER,
  documentType: "INVOICE",
  status: $Enums.DocumentStatus.DRAFT,
  subtotal: 0,
  taxTotal: 0,
  discount: 0,
  total: 0,
  paidAmount: 0,
  totalWithheld: 0,
  balance: 0,
  description: undefined,
  items: initialItemsState,
  fiscalInfo: null,
  documentPayments: [
    {
      paymentMethod: "20",
      term: 0,
      termUnit: "días",
      amount: 0,
    },
  ],
};

interface PurchaseInvoiceFormProps {
  documentId?: string;
}

export const PurchaseInvoiceForm: React.FC<PurchaseInvoiceFormProps> = ({
  documentId,
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  const [persons, setPersons] = useState<PersonInput[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [withholdingCodes, setWithholdingCodes] = useState<WithholdingCode[]>(
    []
  );

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const fetchData = async () => {
      const filter: PersonFilter = {
        tenantId: session.user.tenantId,
        isSupplier: true,
      };

      const [clients, productsRes, warehousesRes, withholdingCodesRes] =
        await Promise.all([
          getPersonsByTenant(filter),
          getAllProducts(session.user.tenantId),
          getWarehouses(session.user.tenantId),
          getAllWithholdingCodes(session.user.tenantId),
        ]);

      if (clients.success) setPersons(clients.data);
      if (productsRes.success) setProducts(productsRes.data);
      if (warehousesRes.success) setWarehouses(warehousesRes.data);
      if (withholdingCodesRes.success)
        setWithholdingCodes(withholdingCodesRes.data);
    };

    fetchData();
  }, [session?.user?.tenantId]);

  const [error, setError] = useState<string | null>(null);
  const [modeEdit, setModeEdit] = useState(!!documentId);
  const [tab, setTab] = useState("items");

  const [withholding, setWithholding] = useState<Withholding | null>(null);

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
  } = methods;

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const handleAddPerson = () => {
    router.push("/personas/nuevo");
  };

  const loadDocument = async () => {
    try {
      const res = await getDocument(documentId!);
      if (!res.success || !res.data)
        return notifyError("Error al cargar documento");

      const itemsRes = await getDocumentItems(res.data.id!);
      const fiscalRes = await getDocumentFiscalInfo(res.data.id!);
      const paymentsRes = await getDocumentPayments(res.data.id!);
      const resDocWithholding = await getWithholdingByBaseDocument(
        res.data.id!
      );

      if (resDocWithholding?.success && resDocWithholding.data) {
        setWithholding(resDocWithholding.data);
      } else {
        setWithholding(null);
      }

      reset({
        ...res.data,
        relatedDocumentId: res.data.relatedDocumentId || null,
        items:
          itemsRes.data?.map((i) => ({
            warehouseId: i.warehouseId,
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            tax: i.tax,
            taxAmount: i.taxAmount,
            discountRate: i.discountRate,
            discountAmount: i.discountAmount,
            subtotal: i.subtotal,
            total: i.total,
          })) ?? initialItemsState,
        fiscalInfo: fiscalRes.data ?? null,
        documentPayments: paymentsRes.data ?? [],
      });

      setModeEdit(true);
    } catch {
      notifyError("Error al cargar documento");
    }
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
      router.push(`/compras/${res.data?.id}/editar`);
    } catch {
      setError("Error inesperado al guardar");
    }
  };

  const handlePaymentRegister = () => {
    router.push(`/transacciones/nueva?documento=${documentId}`);
  };

  const handleSendToSRI = async () => {
    try {
      if (!session?.user.tenantId) return;

      const confirm = await ConfirmDialog.confirm(
        "Confirmación",
        "¿Está seguro de que desea enviar este documento al SRI?"
      );
      if (!confirm) return;

      // Lógica para enviar el documento al SRI
      const response = await sendToSRI(documentId!, session.user.tenantId);

      if (response.success) {
        notifyInfo("Documento enviado al SRI correctamente");
        loadDocument(); // Recargar el documento para actualizar su estado
      } else {
        notifyError(
          `Error al enviar el documento al SRI: ${response.error || ""}`
        );
      }
    } catch (error) {
      notifyError("Ocurrió un error inesperado al enviar el documento al SRI.");
    }
  };

  const handleDownloadXML = () => {
    // Lógica para descargar el XML
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await getInvoiceDataForPDF(documentId!);

      if (!response.success || !response.data) {
        throw new Error("No se pudo obtener la información de la factura");
      }

      // 👉 Generar el documento PDF
      const blob = await pdf(<InvoicePDF factura={response.data} />).toBlob();

      // 👉 Descargar en el navegador
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `RIDE-${response.data.secuencial || "factura"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar PDF:", error);
    }
  };

  // observe
  const selectedPersonId = watch("personId");

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedPersonId),
    [persons, selectedPersonId]
  );

  return (
    <FormProvider {...methods}>
      {/* {JSON.stringify(errors)} */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4 flex items-center justify-end gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {modeEdit ? "Actualizar" : "Guardar"}
            </Button>

            {modeEdit && (
              <>
                {/* REGISTER PAYMENT */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePaymentRegister!()}
                >
                  <DollarSign />
                  Pago
                </Button>
              </>
            )}
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
              {modeEdit
                ? "Editar Factura de Compra"
                : "Nueva Factura de Compra"}
            </CardTitle>
            <CardDescription>
              {modeEdit
                ? "Modifique la información de la factura de compra."
                : "Complete la información para crear una nueva factura de compra."}
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

              {/* ===================== PERSONA ===================== */}
              <PersonSelectField
                control={control}
                name="personId"
                label="Proveedor"
                persons={persons}
                selectedPerson={selectedPerson}
                onAddPerson={handleAddPerson}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* ===================== INFO FISCAL ===================== */}
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
                          ? new Date(field.value).toISOString().substring(0, 10)
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalles del Documento</CardTitle>
            <CardDescription>
              Agregue los productos o servicios que conforman este documento.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="items">Productos / Servicios</TabsTrigger>
                {/* <TabsTrigger value="accounts">Cuentas</TabsTrigger> */}
                <TabsTrigger value="withholding">Retención</TabsTrigger>
                <TabsTrigger value="payments">Formas de Pago</TabsTrigger>
              </TabsList>

              <TabsContent value="items">
                <ItemsTable warehouses={warehouses} products={products} />
              </TabsContent>

              <TabsContent value="withholding">
                {documentId && (
                  <WithholdingView
                    withholdingCodes={withholdingCodes}
                    entityType={watch("entityType")}
                    documentId={documentId}
                    withholdingId={withholding?.id || undefined}
                  />
                )}
              </TabsContent>

              <TabsContent value="payments">
                <PaymentMethodsTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <TotalsSection />
      </form>
    </FormProvider>
  );
};
