"use client";

import { Button } from "@/components/ui/button";
import React from "react";

interface PaginationControlsProps {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean; // mostrar "Página X de Y"
}

export function PaginationControls({
  currentPage,
  itemsPerPage,
  totalItems,
  onPageChange,
  showInfo = true,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={handlePrev}
      >
        Anterior
      </Button>

      {showInfo && (
        <span className="text-sm text-muted-foreground">
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
        </span>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={handleNext}
      >
        Siguiente
      </Button>
    </div>
  );
}
