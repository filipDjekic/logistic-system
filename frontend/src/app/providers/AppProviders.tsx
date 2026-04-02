import type { PropsWithChildren } from "react";
import QueryProvider from "@/app/providers/QueryProvider";
import ThemeProvider from "@/app/providers/ThemeProvider";
import SnackbarProvider from "@/app/providers/SnackbarProvider";

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SnackbarProvider>
        <QueryProvider>{children}</QueryProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}