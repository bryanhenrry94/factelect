"use client";

import { Save } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";

interface HeaderActionsProps {
  modeEdit?: boolean;
}

export default function HeaderActions({ modeEdit }: HeaderActionsProps) {
  const {
    formState: { isSubmitting },
    watch,
  } = useFormContext();

  // Se mantiene por compatibilidad si luego lo usas
  const total = watch("total");

  return (
    <div className="flex justify-end mb-4">
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {modeEdit ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
