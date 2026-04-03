import { createContext } from 'react';
import { alpha, createTheme, type PaletteMode } from '@mui/material/styles';

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

function getTokens(mode: PaletteMode) {
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,
      primary: {
        main: isDark ? '#8B5CF6' : '#5B4BFF',
        light: isDark ? '#A78BFA' : '#7C6DFF',
        dark: isDark ? '#6D28D9' : '#4338CA',
      },
      secondary: {
        main: isDark ? '#22D3EE' : '#0891B2',
        light: isDark ? '#67E8F9' : '#06B6D4',
        dark: isDark ? '#0891B2' : '#0E7490',
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

      // status boje namerno odvojene od brand boja
      success: {
        main: '#16A34A',
      },
      error: {
        main: '#DC2626',
      },
      warning: {
        main: '#D97706',
      },
      info: {
        main: '#2563EB',
      },
    },
    customStatus: {
      draft: '#64748B',
      pending: '#F59E0B',
      inProgress: '#0EA5E9',
      completed: '#16A34A',
      canceled: '#EF4444',
      blocked: '#7C3AED',
      archived: '#6B7280',
    },
  };
}

export function createAppTheme(mode: ThemeMode) {
  const tokens = getTokens(mode);

  return createTheme({
    palette: tokens.palette,
    customStatus: tokens.customStatus,
    shape: {
      borderRadius: 18,
    },
    typography: {
      fontFamily: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '3.25rem',
        fontWeight: 800,
        lineHeight: 1.05,
        letterSpacing: '-0.04em',
      },
      h2: {
        fontSize: '2.6rem',
        fontWeight: 800,
        lineHeight: 1.08,
        letterSpacing: '-0.03em',
      },
      h3: {
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.12,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 700,
      },
      h5: {
        fontSize: '1.15rem',
        fontWeight: 700,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 700,
      },
      button: {
        fontWeight: 700,
        textTransform: 'none',
      },
      body1: {
        lineHeight: 1.7,
      },
      body2: {
        lineHeight: 1.6,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage:
              mode === 'dark'
                ? 'radial-gradient(circle at top, rgba(139, 92, 246, 0.08), transparent 24%)'
                : 'radial-gradient(circle at top, rgba(91, 75, 255, 0.06), transparent 24%)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 24,
            border: `1px solid ${theme.palette.divider}`,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, rgba(18,26,43,0.96), rgba(12,18,31,0.96))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,255,0.96))',
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 20px 60px rgba(0,0,0,0.28)'
                : '0 20px 60px rgba(15,23,42,0.08)',
          }),
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            minHeight: 44,
            borderRadius: 14,
            paddingInline: 18,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 600,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.03)
                : alpha(theme.palette.common.black, 0.015),
          }),
        },
      },
    },
  });
}