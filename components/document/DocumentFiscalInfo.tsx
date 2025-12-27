"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getEmissionPointsByEstablishment, getEstablishments } from "@/actions";
import { getNextSequenceDocumentNumber } from "@/actions/setting/emission-point-sequence";
import { $Enums } from "@/prisma/generated/prisma";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmissionPoint, Establishment } from "@/lib/validations";

export type FiscalInfoValues = {
  establishmentId: string;
  emissionPointId: string;
  sequence: number;
};

interface DocumentFiscalInfoProps {
  documentType: $Enums.DocumentType;
  modeEdit?: boolean;
  value: FiscalInfoValues;
  onChange: (values: FiscalInfoValues) => void;
}

export const DocumentFiscalInfo = ({
  documentType,
  modeEdit,
  value,
  onChange,
}: DocumentFiscalInfoProps) => {
  const { data: session } = useSession();

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [emissionPoints, setEmissionPoints] = useState<EmissionPoint[]>([]);

  /* ========= cargar establecimientos ========= */
  useEffect(() => {
    if (!session?.user.tenantId) return;

    getEstablishments(session.user.tenantId).then((res) => {
      setEstablishments(res.success ? res.data || [] : []);
    });
  }, [session?.user.tenantId]);

  /* ========= cargar puntos por establecimiento ========= */
  const loadEmissionPoints = useCallback(async (estId: string) => {
    if (!estId) {
      setEmissionPoints([]);
      return [];
    }

    const res = await getEmissionPointsByEstablishment(estId);
    const eps = res.success ? res.data || [] : [];
    setEmissionPoints(eps);
    return eps;
  }, []);

  const loadNextSequence = useCallback(
    async (epId: string) => {
      if (!epId) return 0;
      const res = await getNextSequenceDocumentNumber(epId, documentType);
      return res.success && res.nextSequence !== undefined
        ? res.nextSequence
        : 0;
    },
    [documentType]
  );

  /* ========= si viene establishment en value (ej: modo edición), cargar EP ========= */
  useEffect(() => {
    // setear los valores al componente
    if (!value.establishmentId && !value.emissionPointId && !value.sequence)
      return;

    const loadData = async () => {
      await loadEmissionPoints(value.establishmentId);

      onChange({
        establishmentId: value.establishmentId,
        emissionPointId: value.emissionPointId,
        sequence: value.sequence,
      });
    };

    loadData();
  }, [value.establishmentId, value.emissionPointId, value.sequence]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Establecimiento */}
        <div className="space-y-1">
          <Label>Establecimiento</Label>
          <Select
            disabled={modeEdit}
            value={value.establishmentId}
            onValueChange={async (val) => {
              const eps = await loadEmissionPoints(val);
              const epId = eps[0]?.id || "";
              const seq = epId ? await loadNextSequence(epId) : 0;

              onChange({
                establishmentId: val,
                emissionPointId: epId,
                sequence: seq,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona establecimiento" />
            </SelectTrigger>
            <SelectContent>
              {establishments.map((est) => (
                <SelectItem key={est.id} value={est.id || ""}>
                  {est.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Punto de emisión */}
        <div className="space-y-1">
          <Label>Punto de Emisión</Label>
          <Select
            disabled={modeEdit || !value.establishmentId}
            value={value.emissionPointId}
            onValueChange={async (val) => {
              const seq = await loadNextSequence(val);

              onChange({
                ...value,
                emissionPointId: val,
                sequence: seq,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona punto" />
            </SelectTrigger>
            <SelectContent>
              {emissionPoints.map((ep) => (
                <SelectItem key={ep.id} value={ep.id || ""}>
                  {ep.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Secuencia */}
        <div className="space-y-1">
          <Label>Número de Documento</Label>
          <Input
            readOnly
            disabled
            value={
              value.sequence ? value.sequence.toString().padStart(9, "0") : ""
            }
          />
        </div>
      </div>
    </div>
  );
};
