"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { AlertService } from "@/lib/alerts";
import { useSearchFilter } from "@/hooks/useSearchFilter";

import {
  deleteInventoryMovement,
  getInventoryMovements,
} from "@/actions/inventory/inventory-movement";
import { getWarehouses } from "@/actions/inventory/warehouse";

import { InventoryMovement } from "@/lib/validations/inventory/inventory-movement";
import { Warehouse } from "@/lib/validations/inventory/warehouse";
import { formatDate } from "@/utils/formatters";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";

const ROWS_PER_PAGE = 5;

export default function MovimientosInventarioPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { search, setSearch } = useSearchFilter();

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* =========================
     NAVIGATION
  ========================= */
  const handleCreate = () => {
    router.push("/inventario/movimientos/crear");
  };

  const handleEdit = (movement: InventoryMovement) => {
    router.push(`/inventario/movimientos/${movement.id}/editar`);
  };

  /* =========================
     DELETE
  ========================= */
  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el movimiento de inventario?"
    );
    if (!confirm) return;

    const result = await deleteInventoryMovement(id);

    if (result.success) {
      notifyInfo("Movimiento de inventario eliminado correctamente");
      fetchInventoryMovements();
    } else {
      notifyError("Error al eliminar el movimiento de inventario");
    }
  };

  /* =========================
     FETCH DATA
  ========================= */
  const fetchInventoryMovements = async () => {
    if (!session?.user?.tenantId) return;

    try {
      const response = await getInventoryMovements(
        session.user.tenantId,
        search
      );
      if (!response.success) {
        notifyError("Error al cargar los movimientos de inventario");
        return;
      }
      setMovements(response.data || []);
    } catch {
      notifyError("Error al cargar los movimientos de inventario");
    }
  };

  useEffect(() => {
    fetchInventoryMovements();
  }, [session?.user?.tenantId, search]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      if (!session?.user?.tenantId) return;

      try {
        const response = await getWarehouses(session.user.tenantId);
        if (!response.success) {
          notifyError("Error al cargar las bodegas");
          return;
        }
        setWarehouses(response.data || []);
      } catch {
        notifyError("Error al cargar las bodegas");
      }
    };

    fetchWarehouses();
  }, [session?.user?.tenantId]);

  /* =========================
     HELPERS
  ========================= */
  const getLabelForType = (type: string) => {
    switch (type) {
      case "IN":
        return "Ingreso";
      case "OUT":
        return "Egreso";
      case "TRANSFER":
        return "Transferencia";
      case "ADJUST":
        return "Ajuste";
      default:
        return type;
    }
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <PageContainer
      title="Movimientos de Inventario"
      description="Gestiona los movimientos de inventario de tu organización"
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Buscar movimiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {movements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <ShoppingBag className="h-10 w-10" />
              <p className="text-lg font-medium">
                No hay movimientos de inventario aún
              </p>
              <p className="text-sm text-center">
                Agrega el primer movimiento de inventario
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {formatDate(movement.date.toString())}
                        </TableCell>
                        <TableCell>
                          {warehouses.find(
                            (wh) => wh.id === movement.warehouseId
                          )?.name || "—"}
                        </TableCell>
                        <TableCell>{movement.description}</TableCell>
                        <TableCell>{getLabelForType(movement.type)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEdit(movement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDelete(movement.id)}
                          >
                            <Delete className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={warehouses.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
