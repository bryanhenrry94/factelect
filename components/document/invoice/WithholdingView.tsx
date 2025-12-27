"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Import, Files } from "lucide-react";
import { notifyError } from "@/lib/notifications";

import { getWithholding } from "@/actions/withholding/withholding";
import { WithholdingCode } from "@/lib/validations/withholding/withholding-code";
import { Withholding } from "@/lib/validations/withholding/withholding";
import { getAllWithholdingCodes } from "@/actions/withholding/withholding-code";
import { useSession } from "next-auth/react";

export type WithholdingViewProps = {
  withholdingCodes: WithholdingCode[];
  entityType: "CUSTOMER" | "SUPPLIER";
  documentId: string;
  withholdingId?: string;
};

export const WithholdingView: React.FC<WithholdingViewProps> = ({
  documentId,
  withholdingId,
}) => {
  const { data: session } = useSession();

  const router = useRouter();
  const [withholding, setWithholding] = useState<Withholding | null>(null);
  const [withholdingCodes, setWithholdingCodes] = useState<WithholdingCode[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const fetchWithholdingCodes = async () => {
    try {
      if (!session?.user.tenantId) return;

      const res = await getAllWithholdingCodes(session.user.tenantId);
      if (res.success && res.data) {
        setWithholdingCodes(res.data);
      } else {
        notifyError("No se pudieron cargar los códigos de retención");
      }
    } catch {
      notifyError("Error al cargar los códigos de retención");
    }
  };

  useEffect(() => {
    fetchWithholdingCodes();
  }, [session?.user.tenantId]);

  /* ================= cargar retención si existe ================= */
  useEffect(() => {
    if (!withholdingId) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await getWithholding(withholdingId);
        if (res.success && res.data) {
          setWithholding(res.data);
        } else {
          notifyError("No se pudo cargar la retención");
        }
      } catch {
        notifyError("Error al cargar la retención");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [withholdingId]);

  /* ================= UI: sin retención ================= */
  if (!withholdingId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-muted/40 rounded-lg border shadow-sm">
        <Files size={28} />
        <div className="text-xl font-bold">No hay retención</div>
        <div className="text-muted-foreground">
          Este documento no tiene una retención asociada.
        </div>
        <Button
          type="button"
          variant="default"
          size="lg"
          onClick={() =>
            router.push(`/retenciones/nuevo?documentId=${documentId}`)
          }
        >
          <Import className="mr-2 h-5 w-5" />
          Nueva retención
        </Button>
      </div>
    );
  }

  /* ================= UI: cargando ================= */
  if (loading || !withholding) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Cargando retención...
      </div>
    );
  }

  /* ================= UI: con retención ================= */
  return (
    <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-lg">Comprobante de retención</h3>
          <div className="text-sm text-muted-foreground">
            Total retenido:{" "}
            <span className="font-semibold">
              {withholding.totalWithheld.toFixed(2)}
            </span>
          </div>
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/retenciones/${withholding.documentId}/editar`)
            }
          >
            Ver detalle
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Base</TableHead>
            <TableHead className="text-right">%</TableHead>
            <TableHead className="text-right">Retenido</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {withholding.details.map((d) => (
            <TableRow key={d.codeId}>
              <TableCell>
                {withholdingCodes.find((code) => code.id === d.codeId)?.code ||
                  d.codeId}
              </TableCell>
              <TableCell>
                {withholdingCodes.find((code) => code.id === d.codeId)
                  ?.description || d.codeId}
              </TableCell>
              <TableCell className="text-right">
                {d.baseAmount.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                {d.percentage.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {d.withheldAmount.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}

          <TableRow>
            <TableCell colSpan={3} className="text-right font-semibold">
              Total
            </TableCell>
            <TableCell className="text-right font-semibold">
              {withholding.totalWithheld.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
