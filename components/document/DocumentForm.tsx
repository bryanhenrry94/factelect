"use client";
import { Box, Tabs, Tab, Alert, Stack, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import HeaderActions from "./HeaderActions";
import DocumentInfo from "./DocumentInfo";
import ItemsTable from "./ItemsTable";
import TotalsSection from "./TotalsSection";
import TabPanel from "@/components/ui/TabPanel";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useTenant from "@/hooks/useTenant";
import { AlertService } from "@/lib/alerts";
import { useRouter } from "next/navigation";
import { PersonInput } from "@/lib/validations/person";
import { $Enums } from "@/prisma/generated/prisma";
import {
  CreateDocument,
  CreateDocumentItem,
  createDocumentSchema,
  DocumentPayment,
  Product,
} from "@/lib/validations";
import {
  createDocument,
  getDocument,
  getDocumentItems,
  updateDocument,
} from "@/actions";
import { CreateDocumentFiscalInfo } from "@/lib/validations/document/document-fiscal-info";
import { getDocumentFiscalInfo } from "@/actions/document/document-fiscal-info";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { PaymentMethodsTable } from "./PaymentMethodsTable";
import { getDocumentPayments } from "@/actions/document/document-payment";

const initialItemsState: CreateDocumentItem[] = [
  {
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
  products: Product[];
}

export default function DocumentForm({
  documentId,
  persons,
  products,
}: DocumentFormProps) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [modeEdit, setModeEdit] = useState<boolean>(!!documentId);
  const [tabValue, setTabValue] = useState(0);
  const { tenant } = useTenant();
  const handleTabChange = (_: any, newValue: number) => setTabValue(newValue);

  const methods = useForm<CreateDocument>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: initialState,
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
  } = methods;

  useEffect(() => {
    if (!documentId) return;

    loadDocument();
  }, [documentId, reset]);

  const loadDocument = async () => {
    try {
      if (!documentId) return;

      const response = await getDocument(documentId);

      if (response.success && response.data) {
        setModeEdit(true);

        const items: CreateDocumentItem[] = [];

        // Carga detalle de items
        const itemsResponse = await getDocumentItems(response.data.id!);
        if (itemsResponse.success && itemsResponse.data) {
          itemsResponse.data.forEach((item) => {
            items.push({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              tax: item.tax,
              taxAmount: item.taxAmount,
              discountRate: item.discountRate,
              discountAmount: item.discountAmount,
              subtotal: item.subtotal,
              total: item.total,
            });
          });
        }

        const infoFiscal: CreateDocumentFiscalInfo = initialFiscalInfoState;

        const responseFiscalInfo = await getDocumentFiscalInfo(
          response.data.id!
        );
        if (responseFiscalInfo.success && responseFiscalInfo.data) {
          infoFiscal.establishmentId = responseFiscalInfo.data.establishmentId;
          infoFiscal.emissionPointId = responseFiscalInfo.data.emissionPointId;
          infoFiscal.sequence = responseFiscalInfo.data.sequence;
        }

        const resDocPayments = await getDocumentPayments(response.data.id!);
        const documentPayments: DocumentPayment[] = [];
        if (resDocPayments.success && resDocPayments.data) {
          documentPayments.push(...resDocPayments.data);
        }

        const data: CreateDocument = {
          entityType: response.data.entityType,
          documentType: response.data.documentType,
          personId: response.data.personId,
          issueDate: response.data.issueDate,
          status: response.data.status as "DRAFT" | "CONFIRMED" | "CANCELED",
          subtotal: response.data.subtotal,
          taxTotal: response.data.taxTotal,
          discount: response.data.discount,
          total: response.data.total,
          paidAmount: response.data.paidAmount,
          balance: response.data.balance,
          description: response.data.description || "",
          items,
          fiscalInfo: infoFiscal,
          documentPayments: documentPayments,
        };
        reset(data);
      } else {
        notifyError("Error al cargar el documento");
      }
    } catch (error) {
      notifyError("Error al cargar el documento");
    }
  };

  const onSubmit = async (data: CreateDocument) => {
    console.log("Document Data:", data);

    try {
      setError?.(null);

      if (!tenant) {
        setError?.("Configuración de empresa no encontrada.");
        return;
      }

      if (!tenant?.ruc) {
        setError?.("RUC de la empresa no encontrado.");
        return;
      }

      const confirm = await AlertService.showConfirm(
        "Estas seguro de continuar?",
        `Esta acción ${modeEdit ? "actualizará" : "creará"} el documento.`
      );
      if (!confirm) return;

      const response = modeEdit
        ? await updateDocument(documentId!, data)
        : await createDocument(data, tenant.id ?? "");

      if (!response) {
        setError?.("Error al procesar la venta");
        return;
      }

      if (!response.success) {
        setError?.(
          response.error ||
            `Error al ${modeEdit ? "actualizar" : "crear"} la venta`
        );
        return;
      }

      await notifyInfo(
        `Documento ${modeEdit ? "actualizado" : "creado"} exitosamente.`
      );

      if (!modeEdit) reset(initialState);
      router.push(`/documentos/${response.data?.id}/editar`);
    } catch (err) {
      setError?.("Error al enviar el formulario");
    }
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <HeaderActions modeEdit={modeEdit} />

        {error && <Alert severity="error">{error}</Alert>}
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

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Información del Documento
          </Typography>
          <Stack spacing={2} mt={2}>
            <Grid container spacing={5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <DocumentInfo modeEdit={modeEdit} persons={persons} />
              </Grid>
            </Grid>
          </Stack>
        </Box>

        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Productos / Servicios" />
          <Tab label="Cuentas" />
          <Tab label="Retención" />
          <Tab label="Formas de Pago" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ItemsTable products={products} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}></TabPanel>
        <TabPanel value={tabValue} index={2}></TabPanel>
        <TabPanel value={tabValue} index={3}>
          <PaymentMethodsTable />
        </TabPanel>

        <TotalsSection />
      </Box>
    </FormProvider>
  );
}
