import { $Enums } from "@/prisma/generated/prisma";
import { SalesInvoiceForm } from "./invoice/SalesInvoiceForm";
import { PurchaseInvoiceForm } from "./PurchaseInvoiceForm";
import { WithholdingForm } from "./WithholdingForm";
import { RemissionGuideForm } from "./RemissionGuideForm";

type DocumentFormPageProps = {
  defaultEntityType: $Enums.EntityType;
  defaultDocumentType: $Enums.DocumentType;
  documentId?: string;
};

export const DocumentFormPage: React.FC<DocumentFormPageProps> = ({
  defaultEntityType,
  defaultDocumentType,
  documentId,
}) => {
  const entityType = defaultEntityType;
  const documentType = defaultDocumentType;

  switch (documentType) {
    case "INVOICE":
      return entityType === "CUSTOMER" ? (
        <SalesInvoiceForm documentId={documentId} />
      ) : (
        <PurchaseInvoiceForm documentId={documentId} />
      );

    case "WITHHOLDING":
      return <WithholdingForm documentId={documentId} />;
    case "REMISSION_GUIDE":
      return <RemissionGuideForm documentId={documentId} />;

    default:
      return <div>Tipo no soportado</div>;
  }
};
