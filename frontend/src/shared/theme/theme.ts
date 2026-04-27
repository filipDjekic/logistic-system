import { createContext } from 'react';
import { createTheme, type PaletteMode } from '@mui/material/styles';
import { createPalette } from './palette';
import { appTypography } from './typography';
import { createAppShadows } from './shadows';
import { createComponents } from './components';

export type ThemeMode = 'light' | 'dark';

export const THEME_MODE_STORAGE_KEY = 'logistics_theme_mode';

type ColorModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'dark',
  setMode: () => undefined,
  toggleMode: () => undefined,
});

declare module '@mui/material/styles' {
  interface Theme {
    customStatus: {
      draft: string;
      pending: string;
      inProgress: string;
      completed: string;
      canceled: string;
      blocked: string;
      archived: string;
    };
  }

  interface ThemeOptions {
    customStatus?: {
      draft?: string;
      pending?: string;
      inProgress?: string;
      completed?: string;
      canceled?: string;
      blocked?: string;
      archived?: string;
    };
  }
}

function getCustomStatusTokens() {
  return {
    draft: '#64748B',
    pending: '#F59E0B',
    inProgress: '#0EA5E9',
    completed: '#16A34A',
    canceled: '#EF4444',
    blocked: '#7C3AED',
    archived: '#6B7280',
  };
}

export function createAppTheme(mode: ThemeMode) {
  const paletteMode: PaletteMode = mode;

  return createTheme({
    palette: createPalette(paletteMode),
    typography: appTypography,
    shadows: createAppShadows(mode),
    components: createComponents(paletteMode),
    customStatus: getCustomStatusTokens(),
    shape: {
      borderRadius: 10,
    },
  });
}