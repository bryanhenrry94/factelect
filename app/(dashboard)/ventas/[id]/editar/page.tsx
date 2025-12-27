"use client";

import PageContainer from "@/components/container/PageContainer";
import { DocumentFormPage } from "@/components/document/DocumentFormPage";

import { $Enums } from "@/prisma/generated/prisma";
import { useParams } from "next/navigation";

export default function SaleEditPage() {
  const params = useParams<{ id: string }>();

  return (
    <PageContainer
      title="Factura de Venta"
      description="Editar factura de venta"
    >
      <DocumentFormPage
        defaultEntityType={$Enums.EntityType.CUSTOMER}
        defaultDocumentType={$Enums.DocumentType.INVOICE}
        documentId={params.id}
      />
    </PageContainer>
  );
}
