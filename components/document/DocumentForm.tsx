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
import TotalsSection from "./sales/TotalsSection";
import { PaymentMethodsTable } from "./sales/PaymentMethodsTable";

import useTenant from "@/hooks/useTenant";
import { notifyError, notifyInfo } from "@/lib/notifications";

import {
  CreateDocument,
  CreateDocumentItem,
  createDocumentSchema,
  Product,
} from "@/lib/validations";
import { PersonInput } from "@/lib/validations/person/person";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { CreateDocumentFiscalInfo } from "@/lib/validations/document/document-fiscal-info";

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
import { ConfirmDialog } from "../ConfirmDialog";
import InvoicePDF from "../pdf/InvoicePDF";
import { pdf } from "@react-pdf/renderer";
import { WithholdingForm } from "../withholding/withholding";
import { WithholdingCode } from "@/lib/validations/withholding/withholding-code";
import {
  getWithholdingByBaseDocument,
  getWithholdingByDocumentId,
} from "@/actions/withholding/withholding";
import { Withholding } from "@/lib/validations/withholding/withholding";
import { useSession } from "next-auth/react";
import { PersonFilter } from "@/types";
import { getWarehouses } from "@/actions/inventory/warehouse";
import { getAllWithholdingCodes } from "@/actions/withholding/withholding-code";

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
  sriStatus: "DRAFT",
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
  totalWithheld: 0,
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
  defaultEntityType: $Enums.EntityType;
  defaultDocumentType: $Enums.DocumentType;
  mode: "SALES" | "PURCHASES";
}

export default function DocumentForm({
  documentId,
  defaultEntityType,
  defaultDocumentType,
  mode,
}: DocumentFormProps) {
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
        isCustomer: true,
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
  const [showHeader, setShowHeader] = useState(true);

  const methods = useForm<CreateDocument>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: initialState,
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = methods;

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const res = await getDocument(documentId!);
      if (!res.success || !res.data)
        return notifyError("Error al cargar documento");

      const itemsRes = await getDocumentItems(res.data.id!);
      const fiscalRes = await getDocumentFiscalInfo(res.data.id!);
      const paymentsRes = await getDocumentPayments(res.data.id!);

      let resDocWithholding;

      if (res.data.documentType === "INVOICE") {
        // La factura es el documento base
        resDocWithholding = await getWithholdingByBaseDocument(res.data.id!);
      } else if (res.data.documentType === "WITHHOLDING") {
        // Ya estoy sobre el documento de la retención
        resDocWithholding = await getWithholdingByDocumentId(res.data.id!);
        setShowHeader(false);
      }

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
      if (!session?.user.tenantId) return;

      const confirm = await ConfirmDialog.confirm(
        "Confirmación",
        `Esta acción ${modeEdit ? "actualizará" : "creará"} el documento`
      );
      if (!confirm) return;

      const res = modeEdit
        ? await updateDocument(session.user.tenantId, documentId!, data)
        : await createDocument(session.user.tenantId, data);

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

  return (
    <FormProvider {...methods}>
      {/* {JSON.stringify(errors)} */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <HeaderActions
          modeEdit={modeEdit}
          handlePaymentRegister={handlePaymentRegister}
          handleSendToSRI={handleSendToSRI}
          handleDownloadXML={handleDownloadXML}
          handleDownloadPDF={handleDownloadPDF}
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
            <DocumentInfo
              modeEdit={modeEdit}
              persons={persons}
              onChangeTab={setTab}
            />
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
                {watch("documentType") === "INVOICE" && (
                  <TabsTrigger value="items">Productos / Servicios</TabsTrigger>
                )}

                {watch("documentType") === "WITHHOLDING" && (
                  <TabsTrigger value="withholding">Retención</TabsTrigger>
                )}

                {/* <TabsTrigger value="accounts">Cuentas</TabsTrigger> */}

                {watch("documentType") === "INVOICE" && (
                  <TabsTrigger value="withholding">Retención</TabsTrigger>
                )}

                {watch("documentType") === "INVOICE" && (
                  <TabsTrigger value="payments">Formas de Pago</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="items">
                <ItemsTable warehouses={warehouses} products={products} />
              </TabsContent>

              <TabsContent value="withholding">
                {documentId && (
                  <WithholdingForm
                    withholdingCodes={withholdingCodes}
                    entityType={watch("entityType")}
                    documentId={documentId}
                    withholdingId={withholding?.id || undefined}
                    showHeader={showHeader}
                  />
                )}
              </TabsContent>

              <TabsContent value="payments">
                <PaymentMethodsTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {watch("documentType") === "INVOICE" && <TotalsSection />}
      </form>
    </FormProvider>
  );
}
