import { alpha, type PaletteMode, type ThemeOptions } from '@mui/material/styles';

export function createPalette(mode: PaletteMode): ThemeOptions['palette'] {
  const isDark = mode === 'dark';

  return {
    mode,
    primary: {
      main: isDark ? '#38BDF8' : '#2563EB',
      light: isDark ? '#7DD3FC' : '#60A5FA',
      dark: isDark ? '#0284C7' : '#1D4ED8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: isDark ? '#14B8A6' : '#0F766E',
      light: isDark ? '#5EEAD4' : '#2DD4BF',
      dark: isDark ? '#0F766E' : '#115E59',
      contrastText: '#FFFFFF',
    },
    background: {
      default: isDark ? '#0B1120' : '#F6F8FB',
      paper: isDark ? '#111827' : '#FFFFFF',
    },
    text: {
      primary: isDark ? '#E5E7EB' : '#111827',
      secondary: isDark ? '#9CA3AF' : '#64748B',
    },
    divider: isDark ? alpha('#E5E7EB', 0.1) : alpha('#0F172A', 0.1),
    success: {
      main: '#16A34A',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#D97706',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0284C7',
      contrastText: '#FFFFFF',
    },
  };
}
