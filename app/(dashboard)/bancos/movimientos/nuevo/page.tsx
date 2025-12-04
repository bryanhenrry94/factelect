"use client";
import { BankMovementForm } from "@/components/bank/BankMovementForm";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Typography } from "@mui/material";

export default function NuevoMovimientoBancarioPage() {
  return (
    <PageContainer title="Nuevo Movimiento Bancario">
      <PageHeader
        title="Nuevo Movimiento Bancario"
        routes={[
          {
            name: "Movimientos Bancarios",
            href: "/bancos/movimientos",
          },
        ]}
      />

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Nuevo Movimiento Bancario
        </Typography>
        <BankMovementForm />
      </Card>
    </PageContainer>
  );
}
