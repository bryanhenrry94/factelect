"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
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
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";

import {
  BankMovement,
  BankMovementWithAccount,
} from "@/lib/validations/bank/bank_movement";

import {
  deleteBankMovement,
  getAllBankMovements,
} from "@/actions/bank/bank-movement";

import { formatCurrency, formatDate, toInputDate } from "@/utils/formatters";

import { BankMovementForm } from "@/components/bank/BankMovementForm";
import { $Enums } from "@/prisma/generated/prisma/wasm";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import { AlertService } from "@/lib/alerts";

const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

export default function BankConciliacionPage() {
  const { data: session } = useSession();

  const { search, setSearch } = useSearchFilter();
  const { dateFrom, setDateFrom, dateTo, setDateTo } = useDateRangeFilter({
    defaultFrom: toInputDate(firstDayOfMonth),
    defaultTo: toInputDate(lastDayOfMonth),
  });

  const [open, setOpen] = useState(false);
  const [bankMovements, setBankMovements] = useState<BankMovementWithAccount[]>(
    []
  );
  const [selected, setSelected] = useState<BankMovement | null>(null);

  const fetchBankMovements = async () => {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return;

    try {
      const res = await getAllBankMovements(tenantId, search, dateFrom, dateTo);

      if (!res.success) {
        notifyError("Error al cargar conciliaciones");
        return;
      }

      setBankMovements(res.data || []);
    } catch {
      notifyError("Error al cargar conciliaciones");
    }
  };

  useEffect(() => {
    // fetchBankMovements();
  }, [session?.user?.tenantId, search, dateFrom, dateTo]);

  const handleDelete = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el movimiento?"
    );
    if (!confirm) return;

    const res = await deleteBankMovement(id);
    if (res.success) {
      notifyInfo("Movimiento eliminado");
      fetchBankMovements();
    } else {
      notifyError("Error al eliminar");
    }
  };

  const getTypeLabel = (t: $Enums.BankMovementType) =>
    t === "DEBIT" ? "ND" : "NC";

  const getSymbol = (t: $Enums.BankMovementType) =>
    t === "CREDIT" ? "+" : "-";

  return (
    <PageContainer
      title="Conciliación Bancaria"
      description="Gestiona las conciliaciones bancarias"
    >
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Input
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[150px]"
        />

        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[150px]"
        />

        <Button
          className="ml-auto"
          onClick={() => {
            setSelected(null);
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Conciliación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {bankMovements.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <ShoppingBag className="w-8 h-8 mb-3" />
              <p className="font-medium">No hay conciliaciones aún</p>
              <p className="text-sm">Agrega la primera conciliación bancaria</p>
            </div>
          ) : (
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
                {bankMovements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.account?.name}</TableCell>
                    <TableCell>{getTypeLabel(m.type)}</TableCell>
                    <TableCell>{formatDate(m.date.toString())}</TableCell>
                    <TableCell>
                      {getSymbol(m.type)} {formatCurrency(m.amount)}
                    </TableCell>
                    <TableCell>{m.reference}</TableCell>
                    <TableCell>{m.description}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSelected(m);
                          setOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(m.id)}
                      >
                        <Delete className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selected ? "Editar Conciliación" : "Nueva Conciliación"}
            </DialogTitle>
          </DialogHeader>

          <BankMovementForm bankMovementId={selected?.id} />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
