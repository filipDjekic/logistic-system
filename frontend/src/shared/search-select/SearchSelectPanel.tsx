import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import DataTable from '../components/DataTable/DataTable';
import type { DataTableColumn } from '../types/common.types';

export type SearchSelectColumn<T> = {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  width?: string | number;
};

export type SearchSelectFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type SearchSelectPanelProps<T, TStatus extends string = string> = {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusValue?: TStatus;
  statusLabel?: string;
  statusOptions?: SearchSelectFilterOption<TStatus>[];
  onStatusChange?: (value: TStatus) => void;
  rows: T[];
  columns: SearchSelectColumn<T>[];
  getRowKey: (item: T) => string | number;
  selectedId?: string | number | null;
  onSelect: (item: T) => void;
  getSelectDisabled?: (item: T) => boolean;
  selectLabel?: string;
  selectedLabel?: string | null;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  page?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
};

export function SearchSelectPanel<T, TStatus extends string = string>({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  statusValue,
  statusLabel = 'Status',
  statusOptions,
  onStatusChange,
  rows,
  columns,
  getRowKey,
  selectedId,
  onSelect,
  getSelectDisabled,
  selectLabel = 'Select',
  selectedLabel,
  loading = false,
  error = null,
  emptyMessage = 'No records found.',
  page,
  pageCount,
  onPageChange,
}: SearchSelectPanelProps<T, TStatus>) {
  const hasStatusFilter = Boolean(statusOptions?.length && onStatusChange && statusValue !== undefined);
  const hasPagination = Boolean(onPageChange && pageCount && pageCount > 1 && page !== undefined);
  const tableColumns: DataTableColumn<T>[] = [
    ...columns.map((column) => ({ id: column.key, header: column.label, width: column.width, render: column.render })),
    { id: 'actions', header: 'Action', align: 'right', render: (row: T) => { const rowKey = getRowKey(row); const isSelected = selectedId != null && String(selectedId) === String(rowKey); return <Button size="small" variant={isSelected ? 'contained' : 'outlined'} onClick={() => onSelect(row)} disabled={getSelectDisabled?.(row) ?? false}>{isSelected ? 'Selected' : selectLabel}</Button>; } },
  ];

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {selectedLabel ? (
            <Typography variant="body2" color="text.secondary">
              Selected: {selectedLabel}
            </Typography>
          ) : null}
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {hasStatusFilter ? (
            <TextField
              select
              size="small"
              label={statusLabel}
              value={statusValue}
              onChange={(event) => onStatusChange?.(event.target.value as TStatus)}
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            >
              {statusOptions?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          ) : null}
        </Stack>

        <DataTable columns={tableColumns} rows={rows} getRowId={getRowKey} size="small" loading={loading} error={Boolean(error)} errorTitle={error ?? undefined} emptyTitle={emptyMessage} emptyDescription="" selectedRowId={selectedId} onRowClick={onSelect} isRowClickDisabled={(row) => getSelectDisabled?.(row) ?? false} rowClickLabel="Select row" pagination={hasPagination ? <Stack alignItems="center" sx={{ py: 1 }}><Pagination count={pageCount} page={(page ?? 0) + 1} onChange={(_, nextPage) => onPageChange?.(nextPage - 1)} /></Stack> : undefined} />
      </Stack>
    </Paper>
  );
}
