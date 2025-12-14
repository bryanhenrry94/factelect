"use client";
import React from "react";
import { ModeToggle } from "@/components/mode-toogle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-end p-4">
        <ModeToggle />
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col ">{children}</div>
    </div>
  );
}
