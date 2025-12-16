"use client";

import PageContainer from "@/components/container/PageContainer";

import { EstablishmentForm } from "@/components/establishment/EstablishmentForm";
import { EmissionPointForm } from "@/components/emission-point/EmissionPointForm";

export default function EstablishmentsPage() {
  return (
    <PageContainer
      title="Establecimientos"
      description="Gestiona los establecimientos de tu negocio"
    >
      <div className="grid grid-cols-1 gap-6">
        <EstablishmentForm />
        <EmissionPointForm />
      </div>
    </PageContainer>
  );
}
