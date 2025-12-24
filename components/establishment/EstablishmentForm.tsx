"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Delete, Edit, PlusCircle } from "lucide-react";

import { Establishment } from "@/lib/validations";
import {
  deleteEstablishment,
  getEstablishments,
} from "@/actions/establishment";
import { notifyError, notifyInfo } from "@/lib/notifications";

import EstablishmentDialog from "./establishment-dialog";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ConfirmDialog } from "../ConfirmDialog";

export const EstablishmentForm = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [open, setOpen] = useState(false);
  const [establishmentSelected, setEstablishmentSelected] =
    useState<Establishment | null>(null);

  const { data: session } = useSession();

  const fetchEstablishments = useCallback(async () => {
    if (!session?.user?.tenantId) return;

    const result = await getEstablishments(session.user.tenantId);
    if (result.success) {
      setEstablishments(result.data || []);
    }
  }, [session?.user?.tenantId]);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const handleDeleteEstablishment = async (id: string) => {
    const confirm = await ConfirmDialog.confirm(
      "¿Eliminar este establecimiento?",
      "Esta acción eliminará todos los datos asociados. ¿Desea continuar?"
    );
    if (!confirm) return;

    const result = await deleteEstablishment(id);
    if (result.success) {
      notifyInfo("Establecimiento eliminado correctamente");
      fetchEstablishments();
    } else {
      notifyError("Error al eliminar el establecimiento");
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {establishments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No hay establecimientos registrados.
                </TableCell>
              </TableRow>
            ) : (
              establishments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.address}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEstablishmentSelected(item);
                        setOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDeleteEstablishment(item.id ?? "")}
                    >
                      <Delete className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEstablishmentSelected(null);
                    setOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo Establecimiento
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Dialog */}
      <EstablishmentDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={fetchEstablishments}
        establishmentSelected={establishmentSelected}
      />
    </>
  );
};
