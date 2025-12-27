"use client";

import PageContainer from "@/components/container/PageContainer";
import { DocumentFormPage } from "@/components/document/DocumentFormPage";

import { $Enums } from "@/prisma/generated/prisma";

export default function PurchasesNewPage() {
  return (
    <PageContainer
      title="Factura de Compra"
      description="Crear una nueva factura de compra"
    >
      <DocumentFormPage
        defaultEntityType={$Enums.EntityType.SUPPLIER}
        defaultDocumentType={$Enums.DocumentType.INVOICE}
      />
    </PageContainer>
  );
}
