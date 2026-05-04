import SearchIcon from '@mui/icons-material/Search';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

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
}: SearchSelectPanelProps<T, TStatus>) {
  const hasStatusFilter = Boolean(statusOptions?.length && onStatusChange && statusValue !== undefined);

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
              onChange={(event) => onStatusChange(event.target.value as TStatus)}
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

        {error ? <Alert severity="error">{error}</Alert> : null}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={{ width: column.width }}>
                    {column.label}
                  </TableCell>
                ))}
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const rowKey = getRowKey(row);
                  const isSelected = selectedId != null && String(selectedId) === String(rowKey);

                  return (
                    <TableRow key={rowKey} selected={isSelected} hover>
                      {columns.map((column) => (
                        <TableCell key={column.key}>{column.render(row)}</TableCell>
                      ))}
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => onSelect(row)}
                          disabled={getSelectDisabled?.(row) ?? false}
                        >
                          {isSelected ? 'Selected' : selectLabel}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
}
