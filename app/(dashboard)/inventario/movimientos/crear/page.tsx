import PageContainer from "@/components/container/PageContainer";
import { InventoryMovementForm } from "@/components/inventory/InventoryMovementForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CrearMovimientoInventarioPage() {
  return (
    <PageContainer
      title="Crear Movimiento"
      description="Crea un nuevo movimiento de inventario para tu organización"
    >
      {/* Header */}
      <PageHeader
        title="Nuevo"
        routes={[
          { name: "Movimiento de Inventario", href: "/inventario/movimientos" },
        ]}
      />

      {/* Content */}
      <InventoryMovementForm />
    </PageContainer>
  );
}
