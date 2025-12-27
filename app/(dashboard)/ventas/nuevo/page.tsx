"use client";

import PageContainer from "@/components/container/PageContainer";
import { DocumentFormPage } from "@/components/document/DocumentFormPage";

import { $Enums } from "@/prisma/generated/prisma";

export default function SaleNewPage() {
  return (
    <PageContainer
      title="Factura de Venta"
      description="Crear una nueva factura de venta"
    >
      <DocumentFormPage
        defaultEntityType={$Enums.EntityType.CUSTOMER}
        defaultDocumentType={$Enums.DocumentType.INVOICE}
      />
    </PageContainer>
  );
}
