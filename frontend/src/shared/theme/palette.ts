import { alpha, type PaletteMode, type ThemeOptions } from '@mui/material/styles';

export function createPalette(mode: PaletteMode): ThemeOptions['palette'] {
  const isDark = mode === 'dark';

  return {
    mode,
    primary: {
      main: isDark ? '#8B5CF6' : '#5B4BFF',
      light: isDark ? '#A78BFA' : '#7C6DFF',
      dark: isDark ? '#6D28D9' : '#4338CA',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: isDark ? '#22D3EE' : '#0891B2',
      light: isDark ? '#67E8F9' : '#06B6D4',
      dark: isDark ? '#0891B2' : '#0E7490',
      contrastText: '#FFFFFF',
    },
    background: {
      default: isDark ? '#0A0F1C' : '#F5F7FB',
      paper: isDark ? '#121A2B' : '#FFFFFF',
    },
    text: {
      primary: isDark ? '#E6ECF8' : '#132238',
      secondary: isDark ? '#9DB0CC' : '#5D728E',
    },
    divider: isDark ? alpha('#D7E3F4', 0.1) : alpha('#10213A', 0.1),
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
      main: '#2563EB',
      contrastText: '#FFFFFF',
    },
  };
}