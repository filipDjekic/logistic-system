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
    lineHeight: 1.2,
  },
  h5: {
    fontSize: '1.15rem',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 700,
    lineHeight: 1.35,
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.9rem',
    fontWeight: 600,
    lineHeight: 1.45,
  },
  body1: {
    lineHeight: 1.7,
  },
  body2: {
    lineHeight: 1.6,
  },
  button: {
    fontWeight: 700,
    textTransform: 'none',
    lineHeight: 1.2,
  },
};