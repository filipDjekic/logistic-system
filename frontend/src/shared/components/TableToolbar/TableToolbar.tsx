import type { ReactNode } from 'react';
import { Box, Button, Chip, Stack } from '@mui/material';
import TableDensityControl from './TableDensityControl';
import SearchToolbar from '../SearchToolbar/SearchToolbar';

type ActiveFilterChip = {
  key: string;
  label: string;
  onDelete?: () => void;
};

type Props = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  onClearFilters?: () => void;
  clearDisabled?: boolean;
  actions?: ReactNode;
  filters?: ReactNode;
  activeFilters?: ActiveFilterChip[];
showDensityControl?: boolean;
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
  filters,
  activeFilters = [],
  showDensityControl = true,
}: Props) {
  const hasActions = Boolean(actions || onRefresh || onClearFilters || showDensityControl);
  const hasMainRow = Boolean(onSearchChange || filters || hasActions);

  return (
    <Stack spacing={1.25}>
      {hasMainRow ? (
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', lg: 'center' }}
          justifyContent="space-between"
          flexWrap="wrap"
          useFlexGap
          sx={{
            '& > *': { minWidth: 0 },
          }}
        >
          {onSearchChange ? (
            <Box sx={{ flex: { xs: '1 1 auto', lg: '0 1 360px' } }}>
              <SearchToolbar value={searchValue ?? ''} onChange={onSearchChange} placeholder={searchPlaceholder} fullWidth />
            </Box>
          ) : null}

          {filters ? <Box sx={{ flex: '1 1 420px' }}>{filters}</Box> : null}

          {hasActions ? (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="flex-end"
              flexWrap="wrap"
              useFlexGap
              sx={{ ml: { lg: 'auto' }, '& > *': { width: { xs: '100%', sm: 'auto' } } }}
            >
              {actions ? <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>{actions}</Box> : null}

              {showDensityControl ? <TableDensityControl /> : null}

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
          ) : null}
        </Stack>
      ) : null}

      {activeFilters.length > 0 ? (
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {activeFilters.map((filter) => (
            <Chip key={filter.key} size="small" label={filter.label} onDelete={filter.onDelete} />
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
