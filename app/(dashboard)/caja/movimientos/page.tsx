"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { AlertService } from "@/lib/alerts";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { formatCurrency, formatDate, toInputDate } from "@/utils/formatters";
import {
  getMovementCategoryLabel,
  getMovementTypeLabel,
} from "@/utils/movement";

import {
  deleteCashMovement,
  getAllCashMovements,
} from "@/actions/cash/cash-movement";
import { CashMovement } from "@/lib/validations/cash/cash_movement";
import { CashMovementForm } from "@/components/cash/CashMovementForm";

import { Plus, Edit, Delete, ShoppingBag } from "lucide-react";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

export default function CashBoxMovementsPage() {
  const { data: session } = useSession();

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter({
    defaultFrom: toInputDate(firstDayOfMonth),
    defaultTo: toInputDate(lastDayOfMonth),
  });

  const [open, setOpen] = useState(false);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [cashMovementSelected, setCashMovementSelected] =
    useState<CashMovement | null>(null);

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const fetchCashMovements = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    try {
      const response = await getAllCashMovements(
        tenantId,
        search,
        dateFrom,
        dateTo
      );

      if (!response.success) {
        notifyError("Error al cargar los movimientos");
        return;
      }

      setCashMovements(response.data || []);
    } catch {
      notifyError("Error al cargar los movimientos");
    }
  };

  useEffect(() => {
    fetchCashMovements();
  }, [session?.user?.tenantId, search, dateFrom, dateTo]);

  const handleEdit = (m: CashMovement) => {
    setCashMovementSelected(m);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el movimiento?"
    );
    if (!confirm) return;

    const result = await deleteCashMovement(id);

    if (result.success) {
      notifyInfo("Movimiento eliminado correctamente");
      fetchCashMovements();
    } else notifyError("Error al eliminar el movimiento");
  };

  const paginatedData = cashMovements.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <PageContainer
      title="Movimientos de Caja"
      description="Gestiona tus movimientos de caja"
    >
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />

          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Movimiento
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent>
          {cashMovements.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <ShoppingBag className="h-10 w-10" />
              <p className="mt-3 text-lg font-medium">No hay movimientos aún</p>
              <p className="text-sm">Registra el primer movimiento de caja</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedData.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{getMovementTypeLabel(m.type)}</TableCell>
                      <TableCell>
                        {getMovementCategoryLabel(m.category)}
                      </TableCell>
                      <TableCell>
                        {formatDate(toInputDate(m.createdAt))}
                      </TableCell>
                      <TableCell>{formatCurrency(m.amount)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {m.description}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(m)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(m.id)}
                        >
                          <Delete className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación simple */}
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * rowsPerPage >= cashMovements.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <CashMovementForm
            cashMovementSelected={cashMovementSelected}
            onSave={() => {
              fetchCashMovements();
              setOpen(false);
              setCashMovementSelected(null);
            }}
            onCancel={() => {
              setOpen(false);
              setCashMovementSelected(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
