import type { Shadows } from '@mui/material/styles';

export function createAppShadows(mode: 'light' | 'dark'): Shadows {
  const base = [...Array(25)].map(() => 'none') as Shadows;

  if (mode === 'dark') {
    base[1] = '0 8px 24px rgba(0, 0, 0, 0.18)';
    base[2] = '0 14px 32px rgba(0, 0, 0, 0.22)';
    base[3] = '0 18px 44px rgba(0, 0, 0, 0.26)';
    base[4] = '0 24px 56px rgba(0, 0, 0, 0.3)';
  } else {
    base[1] = '0 8px 24px rgba(15, 23, 42, 0.06)';
    base[2] = '0 14px 32px rgba(15, 23, 42, 0.08)';
    base[3] = '0 18px 44px rgba(15, 23, 42, 0.1)';
    base[4] = '0 24px 56px rgba(15, 23, 42, 0.12)';
  }

  return base;
}