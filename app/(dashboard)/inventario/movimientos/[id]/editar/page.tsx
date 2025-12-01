"use client";
import PageContainer from "@/components/container/PageContainer";
import { InventoryMovementForm } from "@/components/inventory/InventoryMovementForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { useParams } from "next/navigation";

export default function CrearMovimientoInventarioPage() {
  const params = useParams();
  const { id } = params;

  return (
    <PageContainer
      title="Editar Movimiento"
      description="Edita un movimiento de inventario para tu organización"
    >
      {/* Header */}
      <PageHeader
        title="Editar"
        routes={[
          { name: "Movimiento de Inventario", href: "/inventario/movimientos" },
        ]}
      />

      {/* Content */}
      <InventoryMovementForm inventoryMovementId={id as string} />
    </PageContainer>
  );
}
