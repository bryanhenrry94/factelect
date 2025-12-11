import PageContainer from "@/components/container/PageContainer";
import { InventoryMovementForm } from "@/components/inventory/InventoryMovementForm";

export default function CrearMovimientoInventarioPage() {
  return (
    <PageContainer
      title="Crear Movimiento"
      description="Crea un nuevo movimiento de inventario para tu organización"
    >
      {/* Content */}
      <InventoryMovementForm />
    </PageContainer>
  );
}
