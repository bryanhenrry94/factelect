"use client";

import PageContainer from "@/components/container/PageContainer";
import { DocumentFormPage } from "@/components/document/DocumentFormPage";

import { $Enums } from "@/prisma/generated/prisma";

export default function WithholdingNewPage() {
  return (
    <PageContainer title="Retención" description="Crear una nueva retención">
      <DocumentFormPage
        defaultEntityType={$Enums.EntityType.SUPPLIER}
        defaultDocumentType={$Enums.DocumentType.WITHHOLDING}
      />
    </PageContainer>
  );
}
