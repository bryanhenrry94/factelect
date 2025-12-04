"use client";
import { BankMovementForm } from "@/components/bank/BankMovementForm";
import PageContainer from "@/components/container/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Typography } from "@mui/material";
import { useParams } from "next/navigation";

export default function EditarMovimientoBancarioPage() {
  const params = useParams();
  const { id } = params;

  return (
    <PageContainer title="Editar Movimiento Bancario">
      <PageHeader
        title="Editar"
        routes={[
          {
            name: "Movimientos Bancarios",
            href: "/bancos/movimientos",
          },
        ]}
      />

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Editar
        </Typography>
        <BankMovementForm bankMovementId={id as string} />
      </Card>
    </PageContainer>
  );
}
