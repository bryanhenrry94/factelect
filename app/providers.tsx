"use client";

import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@/components/theme-provider";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>{children}</SessionProvider>
      <ToastContainer />
      <ConfirmDialog />
    </ThemeProvider>
  );
}
