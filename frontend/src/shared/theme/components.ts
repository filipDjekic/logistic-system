import { alpha, type PaletteMode, type ThemeOptions } from '@mui/material/styles';

export function createComponents(mode: PaletteMode): ThemeOptions['components'] {
  const isDark = mode === 'dark';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: isDark
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
          boxShadow: theme.shadows[2],
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
        outlined: ({ theme }) => ({
          borderColor: alpha(theme.palette.text.primary, 0.12),
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
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
          minHeight: 44,
        }),
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiTableCell-root': {
            fontWeight: 700,
            color: theme.palette.text.secondary,
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.02)
                : alpha(theme.palette.common.black, 0.02),
          },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomStyle: 'solid',
        },
        head: {
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:hover': {
            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.02)
                : alpha(theme.palette.common.black, 0.015),
          },
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 24,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[4],
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 18,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[3],
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  };
}