import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import type { PropsWithChildren } from "react";
import { theme } from "@/shared/theme/theme";

export default function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}