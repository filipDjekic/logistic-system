import { SnackbarProvider as NotistackProvider } from "notistack";
import type { PropsWithChildren } from "react";

export default function SnackbarProvider({ children }: PropsWithChildren) {
  return (
    <NotistackProvider
      maxSnack={3}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      preventDuplicate
    >
      {children}
    </NotistackProvider>
  );
}