"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type ConfirmOptions = {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

let resolver: (value: boolean) => void;

export function ConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
    confirmText: "Sí",
    cancelText: "Cancelar",
  });

  const handleClose = (result: boolean) => {
    setOpen(false);
    resolver(result);
  };

  // API global
  ConfirmDialog.confirm = (
    title,
    message,
    confirmText = "Sí",
    cancelText = "Cancelar"
  ) => {
    setOptions({ title, message, confirmText, cancelText });
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground mt-2">{options.message}</p>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => handleClose(false)}>
            {options.cancelText}
          </Button>

          <Button variant="destructive" onClick={() => handleClose(true)}>
            {options.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Declaración de la función estática
ConfirmDialog.confirm = (
  title: string,
  message: string,
  confirmText?: string,
  cancelText?: string
): Promise<boolean> => {
  return Promise.resolve(false);
};
