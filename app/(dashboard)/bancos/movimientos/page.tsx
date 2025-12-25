"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

import {
  BankMovement,
  BankMovementWithAccount,
} from "@/lib/validations/bank/bank_movement";
import {
  deleteBankMovement,
  getAllBankMovements,
} from "@/actions/bank/bank-movement";
import { formatCurrency, formatDate, toInputDate } from "@/utils/formatters";
import { $Enums } from "@/prisma/generated/prisma/wasm";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useSearchFilter } from "@/hooks/useSearchFilter";

/* shadcn */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ConfirmDialog } from "@/components/ConfirmDialog";

const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

export default function BankMovementsPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter({
    defaultFrom: toInputDate(firstDayOfMonth),
    defaultTo: toInputDate(lastDayOfMonth),
  });

  const [bankMovements, setBankMovements] = useState<BankMovementWithAccount[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ========================== */
  /* Data */
  /* ========================== */

  const fetchBankMovements = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    const res = await getAllBankMovements(tenantId, search, dateFrom, dateTo);

    if (!res.success) {
      notifyError("Error al cargar los movimientos");
      return;
    }

    setBankMovements(res.data || []);
  };

  useEffect(() => {
    fetchBankMovements();
  }, [session?.user?.tenantId, search, dateFrom, dateTo]);

  /* ========================== */
  /* Actions */
  /* ========================== */

  const handleDelete = async (id: string) => {
    const confirm = await ConfirmDialog.confirm(
      "Aviso",
      "¿Deseas eliminar el movimiento?"
    );
    if (!confirm) return;

    const res = await deleteBankMovement(id);
    if (res.success) {
      notifyInfo("Movimiento eliminado correctamente");
      fetchBankMovements();
    } else notifyError("Error al eliminar el movimiento");
  };

  const handleNew = () => {
    router.push("/bancos/movimientos/nuevo");
  };

  const handleEdit = (m: BankMovement) => {
    if (m.transactionId) {
      router.push(`/transacciones/${m.transactionId}/editar`);
      return;
    }

    router.push(`/bancos/movimientos/${m.id}/editar`);
  };

  const getSymbol = (t: $Enums.BankMovementType) => (t === "OUT" ? "-" : "+");

  const getTypeMovementLabel = (t: $Enums.BankMovementType) =>
    t === "IN" ? "Ingreso" : "Egreso";

  return (
    <PageContainer
      title="Movimientos Bancarios"
      description="Gestiona tus movimientos bancarios"
    >
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 justify-between mb-4">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
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

        <Button onClick={handleNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Bancarios</CardTitle>
          <CardDescription>
            Lista de movimientos bancarios registrados en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bankMovements.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShoppingBag className="mx-auto mb-2" />
              No hay movimientos aún
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {bankMovements
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.account?.name}</TableCell>
                        <TableCell>{getTypeMovementLabel(m.type)}</TableCell>
                        <TableCell>{formatDate(m.date.toString())}</TableCell>
                        <TableCell>
                          {`${getSymbol(m.type)} ${formatCurrency(m.amount)}`}
                        </TableCell>
                        <TableCell>{m.reference}</TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(m)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(m.id)}
                          >
                            <Delete className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={bankMovements.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
