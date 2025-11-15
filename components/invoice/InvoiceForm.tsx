"use client";
import { Box, Tabs, Tab, Alert, Stack } from "@mui/material";
import { use, useEffect, useState } from "react";
import InvoiceHeaderActions from "./InvoiceHeaderActions";
import InvoiceDocumentInfo from "./InvoiceDocumentInfo";
import InvoiceItemsTable from "./InvoiceItemsTable";
import InvoicePaymentMethodsTable from "./InvoicePaymentMethodsTable";
import InvoiceTotalsSection from "./InvoiceTotalsSection";
import TabPanel from "@/components/ui/TabPanel";
import { FormProvider, useForm } from "react-hook-form";
import { CreateInvoice, createInvoiceSchema } from "@/lib/validations/invoice";
import { $Enums } from "@/prisma/generated/prisma/wasm";
import { CreateInvoiceItem } from "@/lib/validations/invoice-item";
import { zodResolver } from "@hookform/resolvers/zod";
import useTenant from "@/hooks/useTenant";
import { AlertService } from "@/lib/alerts";
import {
  createInvoice,
  generateXmlSRI,
  getInvoice,
  getInvoiceDataForPDF,
  getInvoiceItems,
  getInvoicePaymentMethods,
  sendToSRI,
  updateInvoice,
} from "@/app/actions";
import { useRouter } from "next/navigation";
import { CreateInvoicePaymentMethod } from "@/lib/validations/invoice-payment-method";
import LoadingSRI from "../ui/LoadingSRI";
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "@/components/pdf/InvoicePDF";
import { generateBarcodeBase64 } from "@/lib/barcode";

const initialPaymentMethodsState: CreateInvoicePaymentMethod[] = [
  {
    paymentMethod: "20",
    term: 0,
    timeUnit: "DAYS",
    amount: 0,
  },
];

const initialItemsState: CreateInvoiceItem[] = [
  {
    productId: "",
    quantity: 1,
    unitPrice: 0,
    tax: $Enums.taxType.IVA_0,
    taxAmount: 0,
    discountRate: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  },
];

const initialState: CreateInvoice = {
  personId: "",
  establishmentId: "",
  emissionPointId: "",
  sequential: 0,
  issueDate: new Date(),
  term: 0,
  dueDate: new Date(),
  description: null,
  total: 0,
  status: $Enums.InvoiceStatus.DRAFT,
  items: initialItemsState,
  paymentMethods: initialPaymentMethodsState,
};

interface InvoiceFormProps {
  invoiceId?: string;
  clients: any[];
  products: any[];
  establishments: any[];
  sriConfig: any;
  setError?: (error: string | null) => void;
}

export default function InvoiceForm({
  invoiceId,
  clients,
  products,
  establishments,
  sriConfig,
  setError,
}: InvoiceFormProps) {
  const router = useRouter();

  const [modeEdit, setModeEdit] = useState<boolean>(!!invoiceId);
  const [tabValue, setTabValue] = useState(0);
  const [sendingSRI, setSendingSRI] = useState(false);
  const { tenant } = useTenant();
  const handleTabChange = (_: any, newValue: number) => setTabValue(newValue);

  const methods = useForm<CreateInvoice>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: initialState,
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
  } = methods;

  useEffect(() => {
    if (!invoiceId) return;

    loadInvoice();
  }, [invoiceId, reset]);

  const loadInvoice = async () => {
    try {
      if (!invoiceId) return;

      const response = await getInvoice(invoiceId);

      if (response.success && response.data) {
        setModeEdit(true);

        const items: CreateInvoiceItem[] = [];
        const paymentMethods: CreateInvoicePaymentMethod[] = [];

        // Carga detalle de items
        const itemsResponse = await getInvoiceItems(response.data.id!);
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

        // Carga detalle de formas de pago
        const paymentMethodsResponse = await getInvoicePaymentMethods(
          response.data.id!
        );
        if (paymentMethodsResponse.success && paymentMethodsResponse.data) {
          paymentMethodsResponse.data.forEach((pm) => {
            paymentMethods.push({
              paymentMethod: pm.paymentMethod,
              term: pm.term,
              timeUnit: pm.timeUnit,
              amount: pm.amount,
            });
          });
        }

        console.log("response.data: ", response.data);

        const data: CreateInvoice = {
          personId: response.data.personId,
          establishmentId: response.data.establishmentId,
          emissionPointId: response.data.emissionPointId,
          sequential: response.data.sequential,
          issueDate: new Date(response.data.issueDate),
          term: response.data.term,
          dueDate: new Date(response.data.dueDate),
          description: response.data.description,
          total: response.data.total,
          status: response.data.status,
          items: items,
          paymentMethods: paymentMethods,
        };
        reset(data);
      } else {
        AlertService.showError("Error al cargar la factura");
      }
    } catch (error) {
      AlertService.showError("Error al cargar la factura");
    }
  };

  const onSubmit = async (data: CreateInvoice) => {
    console.log("Invoice Data:", data);

    try {
      setError?.(null);

      if (!tenant || !sriConfig) {
        setError?.("Configuración del SRI o de empresa no encontrada.");
        return;
      }

      if (!tenant?.ruc) {
        setError?.("RUC de la empresa no encontrado.");
        return;
      }

      const confirm = await AlertService.showConfirm(
        "Estas seguro de continuar?",
        `Esta acción ${modeEdit ? "actualizará" : "creará"} la factura.`
      );
      if (!confirm) return;

      const response = modeEdit
        ? await updateInvoice(invoiceId!, data)
        : await createInvoice(data, tenant.id ?? "");

      if (!response) {
        setError?.("Error al procesar la factura");
        return;
      }

      if (!response.success) {
        setError?.(
          response.error ||
            `Error al ${modeEdit ? "actualizar" : "crear"} la factura`
        );
        return;
      }

      await AlertService.showSuccess(
        `Factura ${modeEdit ? "actualizada" : "creada"} exitosamente.`
      );

      if (!modeEdit) reset(initialState);
      router.push(`/facturas/${response.data?.id}/edit`);
    } catch (err) {
      setError?.("Error al enviar la factura");
    }
  };

  const handleSendToSRI = async () => {
    if (!invoiceId) return;

    const confirm = await AlertService.showConfirm(
      "Enviar factura al SRI",
      "¿Estás seguro de que deseas enviar esta factura al SRI para su autorización?"
    );
    if (!confirm) return;

    setSendingSRI?.(true);

    try {
      const response = await sendToSRI(invoiceId, tenant.id ?? "");

      if (response.success && response.authorizationNumber) {
        await AlertService.showSuccess("Factura autorizada.");
      } else {
        AlertService.showError(
          `Error al enviar la factura al SRI: ${
            response.error || "Error desconocido"
          }`
        );
      }

      await loadInvoice();
    } catch (error) {
      AlertService.showError("Error al enviar la factura al SRI.");
    } finally {
      setSendingSRI?.(false);
    }
  };

  const handleDownloadXML = async () => {
    if (!invoiceId) return;
    const response = await generateXmlSRI(invoiceId);

    if (response.success && response.xml) {
      const element = document.createElement("a");
      const file = new Blob([response.xml], { type: "application/xml" });
      element.href = URL.createObjectURL(file);
      element.download = `${new Date().toISOString()}.xml`;
      document.body.appendChild(element);
      element.click();
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceId) return;

    const response = await getInvoiceDataForPDF(invoiceId);

    if (!response.success || !response.data) {
      AlertService.showError("Error al obtener los datos de la factura");
      return;
    }

    const blob = await pdf(<InvoicePDF factura={response.data} />).toBlob();

    if (blob) {
      const { infoTributaria } = response.data;
      const serie1 = infoTributaria?.estab;
      const serie2 = infoTributaria?.ptoEmi;
      const sequential = infoTributaria?.secuencial;

      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `${serie1}-${serie2}-${sequential}.pdf`;
      document.body.appendChild(element);
      element.click();
    }
  };

  return (
    <FormProvider {...methods}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <InvoiceHeaderActions
          modeEdit={modeEdit}
          handleSendToSRI={handleSendToSRI}
          sendingSRI={sendingSRI}
          handleDownloadXML={handleDownloadXML}
          handleDownloadPDF={handleDownloadPDF}
        />

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

        <InvoiceDocumentInfo
          clients={clients}
          establishments={establishments}
          modeEdit={modeEdit}
        />

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Productos / Servicios" />
          <Tab label="Formas de Pago" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <InvoiceItemsTable products={products} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <InvoicePaymentMethodsTable />
        </TabPanel>

        <InvoiceTotalsSection />
      </Box>
      <LoadingSRI open={sendingSRI} />
    </FormProvider>
  );
}
