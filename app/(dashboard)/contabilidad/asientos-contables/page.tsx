"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Delete, Edit, Plus, ShoppingBag } from "lucide-react";

import PageContainer from "@/components/container/PageContainer";
import { notifyError, notifyInfo } from "@/lib/notifications";
import { AlertService } from "@/lib/alerts";

import {
  deleteJournalEntry,
  getJournalEntries,
} from "@/actions/accounting/journal-entry";
import { JournalEntry } from "@/lib/validations/accounting/journal_entry";
import { formatDate } from "@/utils/formatters";

/* ShadCN */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function AsientosContablesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ---------------- Debounce ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- URL params ---------------- */
  useEffect(() => {
    const query = new URLSearchParams(params.toString());
    debouncedSearch
      ? query.set("search", debouncedSearch)
      : query.delete("search");

    router.push(`/contabilidad/asientos-contables?${query.toString()}`);
  }, [debouncedSearch]);

  /* ---------------- Fetch ---------------- */
  const fetchJournalEntries = async () => {
    if (!session?.user?.tenantId) return;

    const response = await getJournalEntries(
      session.user.tenantId,
      debouncedSearch
    );

    if (!response.success) {
      notifyError("Error al cargar los asientos contables");
      return;
    }

    setJournalEntries(response.data || []);
  };

  useEffect(() => {
    fetchJournalEntries();
  }, [session?.user?.tenantId, debouncedSearch]);

  /* ---------------- Actions ---------------- */
  const handleCreate = () => {
    router.push("/contabilidad/asientos-contables/nuevo");
  };

  const handleEdit = (entry: JournalEntry) => {
    router.push(`/contabilidad/asientos-contables/${entry.id}/editar`);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await AlertService.showConfirm(
      "Aviso",
      "¿Deseas eliminar el asiento contable?"
    );
    if (!confirmed) return;

    const response = await deleteJournalEntry(id);

    if (response.success) {
      notifyInfo("Asiento contable eliminado correctamente");
      fetchJournalEntries();
    } else {
      notifyError("Error al eliminar el asiento contable");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <PageContainer
      title="Asientos Contables"
      description="Gestiona los asientos contables de tu organización"
    >
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between mb-4">
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />

        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo
        </Button>
      </div>

      <Card>
        <CardContent>
          {journalEntries.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No hay asientos contables
              </h3>
              <p className="text-sm text-muted-foreground">
                Agrega el primero para comenzar
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalEntries
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      (currentPage - 1) * itemsPerPage + itemsPerPage
                    )
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {formatDate(entry.date.toString())}
                        </TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(entry.id)}
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
                totalItems={journalEntries.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
