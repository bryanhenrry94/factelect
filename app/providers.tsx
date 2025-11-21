"use client";

import { ThemeProvider } from "@mui/material/styles";
import { baselightTheme } from "@/utils/theme/DefaultColors";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={baselightTheme}>
      <SessionProvider>{children}</SessionProvider>
      <ToastContainer />
    </ThemeProvider>
  );
}
