"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useFormContext } from "react-hook-form";

import { getEmissionPointsByEstablishment, getEstablishments } from "@/actions";
import { getNextSequenceDocumentNumber } from "@/actions/setting/emission-point-sequence";

import {
  CreateDocument,
  EmissionPointWithEstablishmentSchema,
} from "@/lib/validations";
import { $Enums } from "@/prisma/generated/prisma";

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DocumentFiscalInfoProps {
  modeEdit?: boolean;
  documentType: $Enums.DocumentType;
}

export const DocumentFiscalInfo = ({
  modeEdit,
  documentType,
}: DocumentFiscalInfoProps) => {
  const { data: session } = useSession();

  const [establishments, setEstablishments] = useState<any[]>([]);
  const [emissionPoints, setEmissionPoints] = useState<
    EmissionPointWithEstablishmentSchema[]
  >([]);

  const { control, setValue, getValues } = useFormContext<CreateDocument>();

  // 1️⃣ Fetch establishments
  useEffect(() => {
    if (!session?.user.tenantId) return;

    const fetchEstablishments = async () => {
      const res = await getEstablishments(session.user.tenantId);
      setEstablishments(res.success ? res.data || [] : []);
    };

    fetchEstablishments();
  }, [session?.user.tenantId]);

  // 2️⃣ Load emission points
  const loadEmissionPoints = async (estId: string) => {
    const res = await getEmissionPointsByEstablishment(estId);
    const eps = res.success ? res.data || [] : [];
    setEmissionPoints(eps);
    return eps;
  };

  // 3️⃣ Load next sequence
  const loadNextSequence = async (epId: string) => {
    const res = await getNextSequenceDocumentNumber(epId, documentType);

    setValue(
      "fiscalInfo.sequence",
      res.success && res.nextSequence !== undefined ? res.nextSequence : 0
    );
  };

  // 4️⃣ Apply defaults
  useEffect(() => {
    const applyDefaults = async () => {
      if (!session?.user.tenantId || establishments.length === 0) return;

      const estId = establishments[0].id;
      setValue("fiscalInfo.establishmentId", estId);

      const eps = await loadEmissionPoints(estId);
      if (eps.length === 0) return;

      const epId = eps[0].id;
      setValue("fiscalInfo.emissionPointId", epId);

      if (!epId) return;
      await loadNextSequence(epId);
    };

    applyDefaults();
  }, [establishments, documentType]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Establecimiento */}
        <FormField
          control={control}
          name="fiscalInfo.establishmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Establecimiento</FormLabel>
              <Select
                disabled={modeEdit}
                value={field.value || ""}
                onValueChange={async (val) => {
                  field.onChange(val);

                  const eps = await loadEmissionPoints(val);
                  if (eps.length > 0) {
                    setValue("fiscalInfo.emissionPointId", eps[0].id);
                    if (!eps[0].id) return;
                    await loadNextSequence(eps[0].id);
                  } else {
                    setValue("fiscalInfo.emissionPointId", "");
                    setValue("fiscalInfo.sequence", 0);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona establecimiento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {establishments.map((est) => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Punto de emisión */}
        <FormField
          control={control}
          name="fiscalInfo.emissionPointId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Punto de Emisión</FormLabel>
              <Select
                disabled={modeEdit}
                value={field.value || ""}
                onValueChange={async (val) => {
                  field.onChange(val);
                  await loadNextSequence(val);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona punto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {emissionPoints.map((ep) => (
                    <SelectItem key={ep.id} value={ep.id || ""}>
                      {ep.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Secuencia */}
        <FormField
          control={control}
          name="fiscalInfo.sequence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Documento</FormLabel>
              <FormControl>
                <Input
                  readOnly
                  disabled={modeEdit}
                  value={
                    field.value ? field.value.toString().padStart(9, "0") : ""
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
