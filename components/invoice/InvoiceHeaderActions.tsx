"use client";
import { Box, Button, Stack } from "@mui/material";
import { File, Save, Send } from "lucide-react";
import { useFormContext } from "react-hook-form";
import InvoiceStatusLabel from "./InvoiceStatusLabel";

interface InvoiceHeaderActionsProps {
  modeEdit?: boolean;
  handleSendToSRI?: () => void;
  sendingSRI?: boolean;
  handleDownloadXML?: () => void;
  handleDownloadPDF?: () => void;
}

export default function InvoiceHeaderActions({
  modeEdit,
  handleSendToSRI,
  sendingSRI,
  handleDownloadXML,
  handleDownloadPDF,
}: InvoiceHeaderActionsProps) {
  const {
    formState: { isSubmitting },
    watch,
  } = useFormContext();

  const total = watch("total");

  return (
    <Box display="flex" justifyContent="space-between" gap={2} mb={2}>
      <InvoiceStatusLabel status={watch("status")} />
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
            color="success"
            startIcon={<Send />}
            onClick={handleSendToSRI}
            disabled={sendingSRI || watch("status") !== "DRAFT" || total === 0}
            loading={sendingSRI}
          >
            {sendingSRI ? "Enviando..." : "Enviar al SRI"}
          </Button>
        )}
        {modeEdit && watch("status") === "AUTHORIZED" && (
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
