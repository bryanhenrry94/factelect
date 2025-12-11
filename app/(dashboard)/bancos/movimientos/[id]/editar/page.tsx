"use client";
import { BankMovementForm } from "@/components/bank/BankMovementForm";
import PageContainer from "@/components/container/PageContainer";
import { Card, Typography } from "@mui/material";
import { useParams } from "next/navigation";

export default function EditarMovimientoBancarioPage() {
  const params = useParams();
  const { id } = params;

  return (
    <PageContainer title="Editar Movimiento Bancario">
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Editar
        </Typography>
        <BankMovementForm bankMovementId={id as string} />
      </Card>
    </PageContainer>
  );
}
