"use client";

import PageContainer from "@/components/container/PageContainer";
import { DocumentFormPage } from "@/components/document/DocumentFormPage";

import { $Enums } from "@/prisma/generated/prisma";
import { useParams } from "next/navigation";

export default function PurchaseEditPage() {
  const params = useParams<{ id: string }>();

  return (
    <PageContainer
      title="Factura de Compra"
      description="Editar factura de compra"
    >
      <DocumentFormPage
        defaultEntityType={$Enums.EntityType.SUPPLIER}
        defaultDocumentType={$Enums.DocumentType.INVOICE}
        documentId={params.id}
      />
    </PageContainer>
  );
}
