"use client";

import { useEffect, useState } from "react";
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

import HeaderActions from "./HeaderActions";
import DocumentInfo from "./DocumentInfo";
import ItemsTable from "./ItemsTable";
import TotalsSection from "./TotalsSection";
import { PaymentMethodsTable } from "./PaymentMethodsTable";

import useTenant from "@/hooks/useTenant";
import { notifyError, notifyInfo } from "@/lib/notifications";

import {
  CreateDocument,
  CreateDocumentItem,
  createDocumentSchema,
  DocumentPayment,
  Product,
} from "@/lib/validations";
import { PersonInput } from "@/lib/validations/person";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { CreateDocumentFiscalInfo } from "@/lib/validations/document/document-fiscal-info";

import {
  createDocument,
  getDocument,
  getDocumentItems,
  updateDocument,
} from "@/actions";
import { getDocumentFiscalInfo } from "@/actions/document/document-fiscal-info";
import { getDocumentPayments } from "@/actions/document/document-payment";
import { $Enums } from "@/prisma/generated/prisma";
import { ConfirmDialog } from "../ConfirmDialog";

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

const initialFiscalInfoState: CreateDocumentFiscalInfo = {
  documentId: "",
  establishmentId: "",
  emissionPointId: "",
  sequence: 0,
  accessKey: "",
  authorization: "",
  authorizationDate: new Date(),
  sriStatus: "PENDING",
  environment: "TEST",
  generatedXmlUrl: "",
  authorizedXmlUrl: "",
  pdfUrl: "",
};

const initialState: CreateDocument = {
  personId: "",
  issueDate: new Date(),
  entityType: "CUSTOMER",
  documentType: "INVOICE",
  status: $Enums.DocumentStatus.DRAFT,
  subtotal: 0,
  taxTotal: 0,
  discount: 0,
  total: 0,
  paidAmount: 0,
  balance: 0,
  description: undefined,
  items: initialItemsState,
  fiscalInfo: initialFiscalInfoState,
  documentPayments: [
    {
      paymentMethod: "20",
      term: 0,
      termUnit: "días",
      amount: 0,
    },
  ],
};

interface DocumentFormProps {
  documentId?: string;
  persons: PersonInput[];
  warehouses: Warehouse[];
  products: Product[];
}

export default function DocumentForm({
  documentId,
  persons,
  warehouses,
  products,
}: DocumentFormProps) {
  const router = useRouter();
  const { tenant } = useTenant();

  const [error, setError] = useState<string | null>(null);
  const [modeEdit, setModeEdit] = useState(!!documentId);
  const [tab, setTab] = useState("items");

  const methods = useForm<CreateDocument>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: initialState,
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (documentId) loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const res = await getDocument(documentId!);
      if (!res.success || !res.data)
        return notifyError("Error al cargar documento");

      const itemsRes = await getDocumentItems(res.data.id!);
      const fiscalRes = await getDocumentFiscalInfo(res.data.id!);
      const paymentsRes = await getDocumentPayments(res.data.id!);

      reset({
        ...res.data,
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
        fiscalInfo: fiscalRes.data ?? initialFiscalInfoState,
        documentPayments: paymentsRes.data ?? [],
      });

      setModeEdit(true);
    } catch {
      notifyError("Error al cargar documento");
    }
  };

  const onSubmit = async (data: CreateDocument) => {
    try {
      if (!tenant?.ruc) {
        setError("RUC de la empresa no encontrado.");
        return;
      }

      const confirm = await ConfirmDialog.confirm(
        "Confirmación",
        `Esta acción ${modeEdit ? "actualizará" : "creará"} el documento`
      );
      if (!confirm) return;

      const res = modeEdit
        ? await updateDocument(documentId!, data)
        : await createDocument(data, tenant.id);

      if (!res?.success) {
        setError(res?.error || "Error al guardar documento");
        return;
      }

      notifyInfo(
        `Documento ${modeEdit ? "actualizado" : "creado"} correctamente`
      );
      router.push(`/documentos/${res.data?.id}/editar`);
    } catch {
      setError("Error inesperado al guardar");
    }
  };

  const handlePaymentRegister = () => {
    router.push(`/transacciones/nueva?documento=${documentId}`);
  };

  return (
    <FormProvider {...methods}>
      {/* {JSON.stringify(errors)} */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <HeaderActions
          modeEdit={modeEdit}
          handlePaymentRegister={handlePaymentRegister}
        />

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {modeEdit ? "Editar Documento" : "Nuevo Documento"}
            </CardTitle>
            <CardDescription>
              {modeEdit
                ? "Modifique la información del documento."
                : "Complete la información para crear un nuevo documento."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {errors && Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Errores en el formulario</AlertTitle>
                <AlertDescription>
                  Por favor revise los campos marcados en rojo.
                  {JSON.stringify(errors)}
                </AlertDescription>
              </Alert>
            )}
            <DocumentInfo modeEdit={modeEdit} persons={persons} />
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="items">Productos / Servicios</TabsTrigger>
            <TabsTrigger value="accounts">Cuentas</TabsTrigger>
            <TabsTrigger value="retention">Retención</TabsTrigger>
            <TabsTrigger value="payments">Formas de Pago</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <ItemsTable warehouses={warehouses} products={products} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentMethodsTable />
          </TabsContent>
        </Tabs>

        <TotalsSection />
      </form>
    </FormProvider>
  );
}
