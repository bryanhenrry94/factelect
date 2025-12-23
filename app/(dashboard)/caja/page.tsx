"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { useSession } from "next-auth/react";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

import { formatDate, toInputDate } from "@/utils/formatters";
import { useSearchFilter } from "@/hooks/useSearchFilter";

import { CashBox } from "@/lib/validations/cash/cash_box";
import { deleteCashBox, getAllCashBoxes } from "@/actions/cash/cash-box";
import { CashBoxForm } from "@/components/cash/CashBoxForm";

/* shadcn */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getAccounts } from "@/actions/accounting/chart-of-account";
import { ChartOfAccount } from "@/lib/validations";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";

export default function CashBoxPage() {
  const { data: session } = useSession();
  const { search, setSearch } = useSearchFilter();

  const [open, setOpen] = useState(false);
  const [cashBoxes, setCashBoxes] = useState<CashBox[]>([]);
  const [cashBoxSelected, setCashBoxSelected] = useState<CashBox | null>(null);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchCashBoxes = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    try {
      const response = await getAllCashBoxes(tenantId, search);

      if (!response.success) {
        notifyError("Error al cargar las cajas");
        return;
      }

      setCashBoxes(response.data || []);
    } catch {
      notifyError("Error al cargar las cajas");
    }
  };

  const fetchAccounts = async () => {
    if (!session?.user?.tenantId) return;
    const res = await getAccounts(session.user.tenantId);
    if (!res.success) return notifyError("Error al cargar cuentas contables");
    setAccounts(res.data || []);
  };

  useEffect(() => {
    fetchCashBoxes();
    fetchAccounts();
  }, [session?.user?.tenantId, search]);

  const handleEdit = (cashBox: CashBox) => {
    setCashBoxSelected(cashBox);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await ConfirmDialog.confirm(
      "Aviso",
      "¿Deseas eliminar la caja?"
    );
    if (!confirm) return;

    const result = await deleteCashBox(id);

    if (result.success) {
      notifyInfo("Caja eliminada correctamente");
      fetchCashBoxes();
    } else {
      notifyError("Error al eliminar la caja");
    }
  };

  return (
    <PageContainer title="Caja" description="Gestiona tus cajas">
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Caja
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {cashBoxes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingBag className="h-10 w-10" />
              <p className="mt-3 text-lg font-medium">No hay cajas aún</p>
              <p className="text-sm">Agrega la primera caja para comenzar</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cuenta Contable</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {cashBoxes
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.name || "-"}</TableCell>
                        <TableCell>
                          {formatDate(toInputDate(m.createdAt))}
                        </TableCell>
                        <TableCell>
                          {accounts.find(
                            (account) => account.id === m.accountId
                          )?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              m.status === "ACTIVE" ? "default" : "secondary"
                            }
                          >
                            {m.status === "ACTIVE" ? "Activo" : "Inactivo"}
                          </Badge>{" "}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                              <Delete className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={cashBoxes.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <CashBoxForm
            cashBoxSelected={cashBoxSelected}
            onSave={() => {
              fetchCashBoxes();
              setOpen(false);
              setCashBoxSelected(null);
            }}
            onCancel={() => {
              setOpen(false);
              setCashBoxSelected(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
