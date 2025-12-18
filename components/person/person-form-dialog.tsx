"use client";

import { PersonInput } from "@/lib/validations/person";

import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import PersonForm from "./person-form";

interface PersonFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  personId?: string | null;
  tenantId: string;
}

export default function PersonFormDialog({
  open,
  onClose,
  onSuccess,
  personId,
  tenantId,
}: PersonFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {personId ? "Editar Persona" : "Agregar Persona"}
          </DialogTitle>
        </DialogHeader>
        <PersonForm
          open={open}
          onClose={onClose}
          onSuccess={onSuccess}
          personId={personId ?? null}
          tenantId={tenantId}
        />
      </DialogContent>
    </Dialog>
  );
}
