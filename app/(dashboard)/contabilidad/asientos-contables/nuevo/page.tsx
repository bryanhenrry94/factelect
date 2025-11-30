"use client";
import { JournalEntryForm } from "@/components/accounting/JournalEntryForm";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Typography } from "@mui/material";

export default function NuevoAsientoContablePage() {
  return (
    <PageContainer title="Nuevo Asiento Contable">
      <PageHeader
        title="Nuevo Asiento"
        routes={[
          {
            name: "Asientos Contables",
            href: "/contabilidad/asientos-contables",
          },
        ]}
      />

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Nuevo Asiento Contable
        </Typography>
        <JournalEntryForm journalEntryToEdit={null} />
      </Card>
    </PageContainer>
  );
}
