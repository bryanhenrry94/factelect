"use client";
import { BankMovementForm } from "@/components/bank/BankMovementForm";
import PageContainer from "@/components/container/PageContainer";
import { Card, Typography } from "@mui/material";

export default function NuevoMovimientoBancarioPage() {
  return (
    <PageContainer title="Nuevo Movimiento Bancario">
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Nuevo Movimiento Bancario
        </Typography>
        <BankMovementForm />
      </Card>
    </PageContainer>
  );
}
