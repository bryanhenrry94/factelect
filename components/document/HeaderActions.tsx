"use client";
import { Box, Button, Stack } from "@mui/material";
import { File, Save, Send } from "lucide-react";
import { useFormContext } from "react-hook-form";
import StatusLabel from "./StatusLabel";
import { CreateDocument } from "@/lib/validations";

interface HeaderActionsProps {
  modeEdit?: boolean;
  handleSendToSRI?: () => void;
  sendingSRI?: boolean;
  handleDownloadXML?: () => void;
  handleDownloadPDF?: () => void;
}

export default function HeaderActions({
  modeEdit,
  handleSendToSRI,
  sendingSRI,
  handleDownloadXML,
  handleDownloadPDF,
}: HeaderActionsProps) {
  const {
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useFormContext<CreateDocument>();

  const total = watch("total");

  return (
    <Box display="flex" justifyContent="space-between" gap={2} mb={2}>
      <StatusLabel status={watch("status")} />
      <Stack direction="row" spacing={2}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<Save />}
          disabled={isSubmitting || watch("status") !== "DRAFT" || total === 0}
          loading={isSubmitting}
        >
          {modeEdit ? "Actualizar" : "Guardar"}
        </Button>
        {modeEdit && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Send />}
            onClick={handleSendToSRI}
            disabled={sendingSRI || watch("status") !== "DRAFT" || total === 0}
            loading={sendingSRI}
          >
            {sendingSRI ? "Enviando..." : "Enviar al SRI"}
          </Button>
        )}
        {modeEdit && watch("status") === "CONFIRMED" && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<File />}
              onClick={handleDownloadXML}
            >
              XML
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<File />}
              onClick={handleDownloadPDF}
            >
              Ride
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
