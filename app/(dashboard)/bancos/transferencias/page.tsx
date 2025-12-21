"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatCurrency, formatDate, toInputDate } from "@/utils/formatters";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { AlertService } from "@/lib/alerts";
import {
  BankTransfer,
  BankTransferWithAccount,
} from "@/lib/validations/bank/bank_transfer";
import {
  deleteBankTransfer,
  getAllBankTransfers,
} from "@/actions/bank/bank-transfer";
import { BankTransferForm } from "@/components/bank/BankTransferForm";

const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

const rowsPerPage = 5;

const BankTransfersPage = () => {
  const { data: session } = useSession();

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter({
    defaultFrom: toInputDate(firstDayOfMonth),
    defaultTo: toInputDate(lastDayOfMonth),
  });

  const [open, setOpen] = useState(false);
  const [bankTransfers, setBankTransfers] = useState<BankTransferWithAccount[]>(
    []
  );
  const [bankTransferSelected, setBankTransferSelected] =
    useState<BankTransfer | null>(null);

  const [page, setPage] = useState(0);

  const fetchBankTransfer = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    try {
      const response = await getAllBankTransfers(
        tenantId,
        search,
        dateFrom,
        dateTo
      );

      if (!response.success) {
        notifyError("Error al cargar las transferencias");
        return;
      }

      setBankTransfers(response.data || []);
    } catch {
      notifyError("Error al cargar las transferencias");
    }
  };

  useEffect(() => {
    fetchBankTransfer();
  }, [session?.user?.tenantId, search, dateFrom, dateTo]);

  const handleEdit = (m: BankTransfer) => {
    setBankTransferSelected(m);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar la transferencia?"
    );
    if (!confirm) return;

    const result = await deleteBankTransfer(id);

    if (result.success) {
      notifyInfo("Transferencia eliminada correctamente");
      fetchBankTransfer();
    } else notifyError("Error al eliminar la transferencia");
  };

  const paginated = bankTransfers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <PageContainer
      title="Transferencias Bancarias"
      description="Gestiona tus transferencias bancarias"
    >
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <Input
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64"
          />

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-40"
          />

          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-40"
          />
        </div>

        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Transferencia
        </Button>
      </div>

      {/* Tabla */}
      <Card className="mt-4">
        <CardContent className="p-0">
          {bankTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 text-lg font-semibold">
                No hay transferencias aún
              </h3>
              <p className="text-sm text-muted-foreground">
                Agrega la primera transferencia bancaria
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta Origen</TableHead>
                    <TableHead>Cuenta Destino</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginated.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.fromAccount?.name || ""}</TableCell>
                      <TableCell>{m.toAccount?.name || ""}</TableCell>
                      <TableCell>{formatDate(toInputDate(m.date))}</TableCell>
                      <TableCell>{formatCurrency(m.amount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                            className="text-destructive"
                            onClick={() => handleDelete(m.id)}
                          >
                            <Delete className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación simple */}
              <div className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-muted-foreground">
                  {page * rowsPerPage + 1}–
                  {Math.min((page + 1) * rowsPerPage, bankTransfers.length)} de{" "}
                  {bankTransfers.length}
                </span>
                <div className="flex gap-2">
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
                    disabled={(page + 1) * rowsPerPage >= bankTransfers.length}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <BankTransferForm
            onSave={() => {
              fetchBankTransfer();
              setOpen(false);
              setBankTransferSelected(null);
            }}
            onCancel={() => {
              setOpen(false);
              setBankTransferSelected(null);
            }}
            bankTransferSelected={bankTransferSelected}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default BankTransfersPage;
