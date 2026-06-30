import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

type DetailsFieldProps = {
  label: ReactNode;
  value?: ReactNode;
  helperText?: ReactNode;
  icon?: ReactNode;
  emptyValue?: ReactNode;
  dense?: boolean;
  direction?: 'vertical' | 'horizontal';
  sx?: SxProps<Theme>;
};

export default function DetailsField({
  label,
  value,
  helperText,
  icon,
  emptyValue = '—',
  dense = false,
  direction = 'vertical',
  sx,
}: DetailsFieldProps) {
  const renderedValue = value === null || value === undefined || value === '' ? emptyValue : value;
  const isHorizontal = direction === 'horizontal';

  return (
    <Stack
      direction={isHorizontal ? { xs: 'column', sm: 'row' } : 'column'}
      justifyContent={isHorizontal ? 'space-between' : 'flex-start'}
      alignItems={isHorizontal ? { xs: 'flex-start', sm: 'center' } : 'flex-start'}
      spacing={dense ? 0.5 : 0.75}
      sx={(theme) => ({
        minWidth: 0,
        p: dense ? 0 : { xs: 1.25, sm: 1.5 },
        borderRadius: dense ? 0 : 2,
        border: dense ? 0 : `1px solid ${theme.palette.divider}`,
        backgroundColor: dense ? 'transparent' : theme.palette.background.default,
        ...((typeof sx === 'function' ? sx(theme) : sx) as object),
      })}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
        {icon ? <Box sx={{ display: 'inline-flex', color: 'text.secondary', flexShrink: 0 }}>{icon}</Box> : null}
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={800}
          sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', overflowWrap: 'anywhere' }}
        >
          {label}
        </Typography>
      </Stack>

      <Box sx={{ minWidth: 0, maxWidth: '100%' }}>
        <Typography component="div" variant="body2" fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>
          {renderedValue}
        </Typography>
        {helperText ? (
          <Typography component="div" variant="caption" color="text.secondary" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>
            {helperText}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

export type { DetailsFieldProps };
