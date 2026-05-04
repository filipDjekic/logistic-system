import type { ReactNode } from 'react';
import { Box } from '@mui/material';

type Props = {
  children: ReactNode;
  minColumnWidth?: number;
};

export default function FilterPanel({ children, minColumnWidth = 220 }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`,
        },
        gap: 1.5,
        alignItems: 'start',
        '& .MuiFormControl-root': {
          width: '100%',
          minWidth: 0,
        },
      }}
    >
      {children}
    </Box>
  );
}
