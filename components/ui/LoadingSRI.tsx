"use client";

import React from "react";

interface LoadingSRIProps {
  open: boolean;
}

const LoadingSRI: React.FC<LoadingSRIProps> = ({ open }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl px-8 py-6 shadow-xl max-w-sm w-full">
        <div className="flex flex-col items-center text-center gap-4">
          {/* Spinner */}
          <div className="h-14 w-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-1" />

          <h2 className="text-lg font-medium text-gray-900">
            Enviando comprobante al SRI...
          </h2>
          <p className="text-sm text-gray-500">
            Por favor espera unos segundos mientras se autoriza el comprobante.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSRI;
