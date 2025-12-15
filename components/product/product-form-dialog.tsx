"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { CreateProduct } from "@/lib/validations/inventory/product";
import { ProductForm } from "./product-form";

interface ProductFormDialogProps {
  isDialogOpen: boolean;
  handleCloseDialog: () => void;
  productId: string | null;
  onSubmit: (data: CreateProduct) => Promise<void> | void;
}

export function ProductFormDialog({
  isDialogOpen,
  handleCloseDialog,
  productId,
  onSubmit,
}: ProductFormDialogProps) {
  /* ====================== UI ====================== */
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {productId ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {productId
              ? "Actualiza los datos del producto."
              : "Registra un nuevo producto."}
          </DialogDescription>
        </DialogHeader>

        <ProductForm productId={productId} onCreate={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}
