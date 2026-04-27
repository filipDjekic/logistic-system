import type { Shadows } from '@mui/material/styles';

export function createAppShadows(mode: 'light' | 'dark'): Shadows {
  const base = [...Array(25)].map(() => 'none') as Shadows;

  if (mode === 'dark') {
    base[1] = '0 6px 18px rgba(0, 0, 0, 0.18)';
    base[2] = '0 10px 26px rgba(0, 0, 0, 0.22)';
    base[3] = '0 14px 34px rgba(0, 0, 0, 0.26)';
    base[4] = '0 18px 44px rgba(0, 0, 0, 0.3)';
  } else {
    base[1] = '0 6px 18px rgba(15, 23, 42, 0.05)';
    base[2] = '0 10px 26px rgba(15, 23, 42, 0.07)';
    base[3] = '0 14px 34px rgba(15, 23, 42, 0.09)';
    base[4] = '0 18px 44px rgba(15, 23, 42, 0.11)';
  }

  return base;
}
