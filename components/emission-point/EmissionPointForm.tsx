"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Delete, Edit, PlusCircle } from "lucide-react";

import { deleteEmissionPoint, getEmissionPoints } from "@/actions";
import { AlertService } from "@/lib/alerts";
import {
  EmissionPoint,
  EmissionPointWithEstablishmentSchema,
} from "@/lib/validations";
import { notifyError, notifyInfo } from "@/lib/notifications";

/* shadcn */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import EmissionPointDialog from "./emission-point-dialog";

export const EmissionPointForm = () => {
  const { data: session } = useSession();

  const [emissionPoints, setEmissionPoints] = useState<
    EmissionPointWithEstablishmentSchema[]
  >([]);
  const [open, setOpen] = useState(false);
  const [editingEmissionPoint, setEditingEmissionPoint] =
    useState<EmissionPoint | null>(null);

  const fetchEmissionPoints = useCallback(async () => {
    if (!session?.user?.tenantId) return;
    const result = await getEmissionPoints(session.user.tenantId);
    if (result.success) {
      setEmissionPoints(result.data || []);
    }
  }, [session?.user?.tenantId]);

  useEffect(() => {
    fetchEmissionPoints();
  }, [fetchEmissionPoints]);

  const handleDeleteEmissionPoint = async (id: string) => {
    const confirm = await AlertService.showConfirm(
      "¿Eliminar este punto de emisión?",
      "Esta acción no se puede deshacer."
    );
    if (!confirm) return;

    const result = await deleteEmissionPoint(id);
    if (result.success) {
      notifyInfo("Punto de emisión eliminado.");
      fetchEmissionPoints();
    } else {
      notifyError("Error al eliminar el punto de emisión.");
    }
  };

  return (
    <>
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Establecimiento</TableHead>
              <TableHead>Punto</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {emissionPoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm">
                  No hay puntos de emisión registrados.
                </TableCell>
              </TableRow>
            ) : (
              emissionPoints.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.establishment?.code ?? "-"}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingEmissionPoint(item);
                        setOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEmissionPoint(item.id ?? "")}
                    >
                      <Delete className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingEmissionPoint(null);
                    setOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nuevo Punto de Emisión
                </Button>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Dialog */}
      <EmissionPointDialog
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={fetchEmissionPoints}
        editingData={editingEmissionPoint}
      />
    </>
  );
};
