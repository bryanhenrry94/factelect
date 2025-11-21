import {
  getEmissionPointsByEstablishment,
  getEstablishments,
} from "@/app/actions";
import { getNextSequenceDocumentNumber } from "@/app/actions/sequence_control";
import {
  CreateDocument,
  EmissionPointWithEstablishmentSchema,
} from "@/lib/validations";
import { $Enums } from "@/prisma/generated/prisma";
import { Box, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

interface DocumentFiscalInfoProps {
  modeEdit?: boolean;
  documentType: $Enums.DocumentType;
}

export const DocumentFiscalInfo: React.FC<DocumentFiscalInfoProps> = ({
  modeEdit,
  documentType,
}) => {
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [emissionPoints, setEmissionPoints] = useState<
    EmissionPointWithEstablishmentSchema[]
  >([]);

  const { data: session } = useSession();

  const {
    control,
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext<CreateDocument>();

  // ---------------------------
  // 1. FETCH ESTABLISHMENTS
  // ---------------------------
  useEffect(() => {
    const fetchEstablishments = async () => {
      if (!session?.user.tenantId) return;

      const response = await getEstablishments(session.user.tenantId);

      if (response.success) {
        setEstablishments(response.data || []);
      } else {
        setEstablishments([]);
      }
    };

    fetchEstablishments();
  }, [session?.user.tenantId]);

  // ---------------------------
  // 2. HANDLE ESTABLISHMENT CHANGE
  // ---------------------------
  const loadEmissionPoints = async (estId: string) => {
    const response = await getEmissionPointsByEstablishment(estId);

    if (response.success) {
      setEmissionPoints(response.data || []);
      return response.data || [];
    }

    setEmissionPoints([]);
    return [];
  };

  // ---------------------------
  // 3. HANDLE EMISSION POINT CHANGE
  // ---------------------------
  const loadNextSequence = async (
    tenantId: string,
    esId: string,
    epId: string,
    documentType: $Enums.DocumentType
  ) => {
    const result = await getNextSequenceDocumentNumber(
      tenantId,
      esId,
      epId,
      documentType
    );

    if (result.success && result.nextSequence !== undefined) {
      setValue("fiscalInfo.sequence", result.nextSequence);
    } else {
      setValue("fiscalInfo.sequence", 0);
    }
  };

  // ---------------------------
  // 4. AUTO SET DEFAULT VALUES
  // ---------------------------
  useEffect(() => {
    const applyDefaults = async () => {
      if (establishments.length === 0) return;

      // 1) Establecimiento por defecto
      const defaultEstId = establishments[0].id;
      setValue("fiscalInfo.establishmentId", defaultEstId);

      // 2) Cargar puntos de emisión del establecimiento
      const eps = await loadEmissionPoints(defaultEstId);

      if (eps.length === 0) return;

      // 3) Punto de emisión por defecto
      const defaultEpId = eps[0].id;
      setValue("fiscalInfo.emissionPointId", defaultEpId);

      if (!defaultEpId) return;

      // 4) Cargar secuencia según el documentType
      await loadNextSequence(
        session?.user.tenantId || "",
        defaultEstId,
        defaultEpId,
        documentType
      );
    };

    applyDefaults();
  }, [establishments, documentType]); // <- recalcular siempre cuando cambia el tipo de documento

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6" fontWeight={600}>
        Información del Documento
      </Typography>

      <Stack direction="row" spacing={2}>
        {/* ESTABLISHMENT */}
        <Controller
          name="fiscalInfo.establishmentId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Establecimiento"
              size="small"
              fullWidth
              onChange={async (e) => {
                const val = e.target.value;
                field.onChange(val);

                // Carga puntos de emisión cuando cambia
                const eps = await loadEmissionPoints(val);

                if (eps.length > 0) {
                  setValue("fiscalInfo.emissionPointId", eps[0].id);
                  await loadNextSequence(
                    session?.user.tenantId || "",
                    val,
                    eps[0].id || "",
                    documentType
                  );
                } else {
                  setValue("fiscalInfo.emissionPointId", "");
                  setValue("fiscalInfo.sequence", 0);
                }
              }}
              value={field.value || ""}
              error={!!errors.fiscalInfo?.establishmentId}
              helperText={
                errors.fiscalInfo?.establishmentId?.message?.toString() || ""
              }
              disabled={modeEdit}
            >
              {establishments.map((est: any) => (
                <MenuItem key={est.id} value={est.id}>
                  {est.code}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* EMISSION POINT */}
        <Controller
          name="fiscalInfo.emissionPointId"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Punto de Emisión"
              size="small"
              fullWidth
              onChange={async (e) => {
                const val = e.target.value;
                field.onChange(val);
                await loadNextSequence(
                  session?.user.tenantId || "",
                  getValues("fiscalInfo.establishmentId") || "",
                  val || "",
                  documentType
                );
              }}
              value={field.value || ""}
              error={!!errors.fiscalInfo?.emissionPointId}
              helperText={
                errors.fiscalInfo?.emissionPointId?.message?.toString() || ""
              }
              disabled={modeEdit}
            >
              {emissionPoints.map((ep: any) => (
                <MenuItem key={ep.id} value={ep.id}>
                  {ep.code}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Stack>

      {/* DOCUMENT SEQUENCE */}
      <Controller
        name="fiscalInfo.sequence"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Número de Documento"
            size="small"
            fullWidth
            value={field.value ? field.value.toString().padStart(9, "0") : ""}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
            error={!!errors.fiscalInfo?.sequence}
            helperText={errors.fiscalInfo?.sequence?.message?.toString() || ""}
            disabled={modeEdit}
          />
        )}
      />
    </Box>
  );
};
