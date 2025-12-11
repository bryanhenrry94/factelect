"use client";
import PageContainer from "@/components/container/PageContainer";
import { InventoryMovementForm } from "@/components/inventory/InventoryMovementForm";
import { useParams } from "next/navigation";

export default function CrearMovimientoInventarioPage() {
  const params = useParams();
  const { id } = params;

  return (
    <PageContainer
      title="Editar Movimiento"
      description="Edita un movimiento de inventario para tu organización"
    >
      {/* Content */}
      <InventoryMovementForm inventoryMovementId={id as string} />
    </PageContainer>
  );
}
