"use client";

import PageContainer from "@/components/container/PageContainer";
import { DocumentFormPage } from "@/components/document/DocumentFormPage";

import { $Enums } from "@/prisma/generated/prisma";
import { useParams } from "next/navigation";

export default function PurchaseEditPage() {
  const params = useParams<{ id: string }>();

  return (
    <PageContainer title="Retención" description="Editar Retención">
      <DocumentFormPage
        defaultEntityType={$Enums.EntityType.SUPPLIER}
        defaultDocumentType={$Enums.DocumentType.WITHHOLDING}
        documentId={params.id}
      />
    </PageContainer>
  );
}
