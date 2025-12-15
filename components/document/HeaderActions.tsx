"use client";

import { File, Save, Send } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import StatusLabel from "./StatusLabel";
import { CreateDocument } from "@/lib/validations";
import { cn } from "@/lib/utils";

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
    formState: { isSubmitting },
    watch,
  } = useFormContext<CreateDocument>();

  const status = watch("status");
  const total = watch("total");

  const isDraft = status === "DRAFT";
  const isConfirmed = status === "CONFIRMED";
  const disableByTotal = total === 0;

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      {/* STATUS */}
      <StatusLabel status={status} />

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center gap-2">
        {/* SAVE */}
        <Button
          type="submit"
          disabled={isSubmitting || !isDraft || disableByTotal}
        >
          <Save className="mr-2 h-4 w-4" />
          {modeEdit ? "Actualizar" : "Guardar"}
        </Button>

        {/* SEND TO SRI */}
        {modeEdit && (
          <Button
            variant="outline"
            onClick={handleSendToSRI}
            disabled={sendingSRI || !isDraft || disableByTotal}
          >
            <Send className="mr-2 h-4 w-4" />
            {sendingSRI ? "Enviando..." : "Enviar al SRI"}
          </Button>
        )}

        {/* DOWNLOADS */}
        {modeEdit && isConfirmed && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleDownloadXML}>
              <File className="mr-2 h-4 w-4" />
              XML
            </Button>

            <Button variant="secondary" onClick={handleDownloadPDF}>
              <File className="mr-2 h-4 w-4" />
              Ride
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
