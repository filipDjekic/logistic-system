import type { ThemeOptions } from '@mui/material/styles';

export const appTypography: ThemeOptions['typography'] = {
  fontFamily: [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'sans-serif',
  ].join(','),
  h1: {
    fontSize: '2.75rem',
    fontWeight: 800,
    lineHeight: 1.08,
    letterSpacing: '-0.035em',
  },
  h2: {
    fontSize: '2.25rem',
    fontWeight: 800,
    lineHeight: 1.12,
    letterSpacing: '-0.03em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 750,
    lineHeight: 1.18,
    letterSpacing: '-0.02em',
  },
  h4: {
    fontSize: '1.375rem',
    fontWeight: 750,
    lineHeight: 1.25,
    letterSpacing: '-0.015em',
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 700,
    lineHeight: 1.35,
  },
  subtitle1: {
    fontSize: '0.95rem',
    fontWeight: 650,
    lineHeight: 1.45,
  },
  subtitle2: {
    fontSize: '0.85rem',
    fontWeight: 650,
    lineHeight: 1.4,
  },
  body1: {
    fontSize: '0.95rem',
    lineHeight: 1.65,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.55,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
  },
  button: {
    fontWeight: 700,
    textTransform: 'none',
    lineHeight: 1.2,
  },
};
