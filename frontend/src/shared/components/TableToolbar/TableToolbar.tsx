import type { ReactNode } from 'react';
import { Box, Button, Stack } from '@mui/material';
import SearchToolbar from '../SearchToolbar/SearchToolbar';

type Props = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  onClearFilters?: () => void;
  clearDisabled?: boolean;
  actions?: ReactNode;
};

export default function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  onRefresh,
  refreshDisabled = false,
  onClearFilters,
  clearDisabled = false,
  actions,
}: Props) {
  return (
    <Stack spacing={1.5}>
      {onSearchChange ? (
        <SearchToolbar value={searchValue ?? ''} onChange={onSearchChange} placeholder={searchPlaceholder} fullWidth />
      ) : null}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="flex-end"
        flexWrap="wrap"
        useFlexGap
        sx={{
          '& > *': { width: { xs: '100%', sm: 'auto' } },
        }}
      >
        {actions ? <Box sx={{ mr: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>{actions}</Box> : null}

        {onRefresh ? (
          <Button variant="outlined" onClick={onRefresh} disabled={refreshDisabled}>
            Refresh
          </Button>
        ) : null}

        {onClearFilters ? (
          <Button variant="text" onClick={onClearFilters} disabled={clearDisabled}>
            Clear filters
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
