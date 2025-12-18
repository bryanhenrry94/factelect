"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Controller, useFormContext } from "react-hook-form";

import { getEmissionPointsByEstablishment, getEstablishments } from "@/actions";
import { getNextSequenceDocumentNumber } from "@/actions/sequence_control";

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
import { FormGroup } from "@mui/material";

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

  // ---------------------------
  // 1. FETCH ESTABLISHMENTS
  // ---------------------------
  useEffect(() => {
    if (!session?.user.tenantId) return;

    const fetchEstablishments = async () => {
      const res = await getEstablishments(session.user.tenantId);
      setEstablishments(res.success ? res.data || [] : []);
    };

    fetchEstablishments();
  }, [session?.user.tenantId]);

  // ---------------------------
  // 2. LOAD EMISSION POINTS
  // ---------------------------
  const loadEmissionPoints = async (estId: string) => {
    const res = await getEmissionPointsByEstablishment(estId);
    const eps = res.success ? res.data || [] : [];
    setEmissionPoints(eps);
    return eps;
  };

  // ---------------------------
  // 3. LOAD NEXT SEQUENCE
  // ---------------------------
  const loadNextSequence = async (
    tenantId: string,
    estId: string,
    epId: string
  ) => {
    const res = await getNextSequenceDocumentNumber(
      tenantId,
      estId,
      epId,
      documentType
    );

    setValue(
      "fiscalInfo.sequence",
      res.success && res.nextSequence !== undefined ? res.nextSequence : 0
    );
  };

  // ---------------------------
  // 4. APPLY DEFAULTS
  // ---------------------------
  useEffect(() => {
    const applyDefaults = async () => {
      if (!session?.user.tenantId || establishments.length === 0) return;

      const estId = establishments[0].id;
      setValue("fiscalInfo.establishmentId", estId);

      const eps = await loadEmissionPoints(estId);
      if (eps.length === 0) return;

      const epId = eps[0].id;
      setValue("fiscalInfo.emissionPointId", epId);

      await loadNextSequence(session.user.tenantId, estId, epId || "");
    };

    applyDefaults();
  }, [establishments, documentType]);

  return (
    <div className="flex flex-col gap-4">
      <FormGroup>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ESTABLECIMIENTO */}
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
                      await loadNextSequence(
                        session?.user.tenantId || "",
                        val,
                        eps[0].id || ""
                      );
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

          {/* PUNTO DE EMISIÓN */}
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
                    await loadNextSequence(
                      session?.user.tenantId || "",
                      getValues("fiscalInfo.establishmentId") || "",
                      val
                    );
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

          {/* SECUENCIA */}
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
      </FormGroup>
    </div>
  );
};
