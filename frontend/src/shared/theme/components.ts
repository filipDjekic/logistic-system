import { alpha, type PaletteMode, type ThemeOptions } from '@mui/material/styles';

export function createComponents(mode: PaletteMode): ThemeOptions['components'] {
  const isDark = mode === 'dark';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'none',
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
          borderRadius: 12,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow: theme.shadows[1],
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 40,
          whiteSpace: 'nowrap',
          borderRadius: 8,
          paddingInline: 16,
        },
        sizeSmall: {
          minHeight: 34,
          paddingInline: 12,
        },
        sizeLarge: {
          minHeight: 44,
          paddingInline: 18,
        },
        outlined: ({ theme }) => ({
          borderColor: alpha(theme.palette.text.primary, 0.14),
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor: isDark
            ? alpha(theme.palette.common.white, 0.025)
            : alpha(theme.palette.common.black, 0.012),
          minHeight: 40,
        }),
        input: {
          paddingTop: 9,
          paddingBottom: 9,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
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
          borderRadius: 12,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiTableCell-root': {
            fontWeight: 700,
            color: theme.palette.text.secondary,
            backgroundColor: isDark
              ? alpha(theme.palette.common.white, 0.035)
              : alpha(theme.palette.common.black, 0.025),
          },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomStyle: 'solid',
          maxWidth: 360,
          paddingTop: 12,
          paddingBottom: 12,
        },
        head: {
          whiteSpace: 'nowrap',
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:hover': {
            backgroundColor: isDark
              ? alpha(theme.palette.common.white, 0.035)
              : alpha(theme.palette.common.black, 0.018),
          },
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 14,
          margin: 12,
          width: 'calc(100% - 24px)',
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[4],
          backgroundImage: 'none',
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[3],
          backgroundImage: 'none',
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  };
}
