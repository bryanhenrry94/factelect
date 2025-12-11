"use client";

import { CashReconciliationForm } from "@/components/cash/CashReconciliationForm";
import PageContainer from "@/components/container/PageContainer";
import React from "react";

export default function CashReconciliationPage() {
  const [cashBox, setCashBox] = React.useState(undefined);
  const [session, setSession] = React.useState(undefined);
  const [movements, setMovements] = React.useState([]);

  return (
    <PageContainer
      title="Conciliación de Caja"
      description="Realiza el arqueo de caja para cerrar la sesión actual."
    >
      <CashReconciliationForm
        cashBox={cashBox}
        session={session}
        movements={movements}
      />
    </PageContainer>
  );
}
