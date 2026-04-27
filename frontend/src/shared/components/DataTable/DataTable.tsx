import type { ReactNode } from 'react';
import {
  alpha,
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import EmptyState from '../EmptyState/EmptyState';
import ErrorState from '../ErrorState/ErrorState';
import type { DataTableColumn, RowId, SortState } from '../../types/common.types';
import { getStatusConfig } from '../../../core/constants/statuses';

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId?: (row: T, index: number) => RowId;
  loading?: boolean;
  error?: boolean;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  minWidth?: number;
  stickyHeader?: boolean;
  size?: 'small' | 'medium';
  toolbar?: ReactNode;
  pagination?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  getRowStatus?: (row: T) => string | null | undefined;
};

function formatCellValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  error = false,
  errorTitle,
  errorDescription,
  onRetry,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display for the current view.',
  minWidth = 720,
  stickyHeader = false,
  size = 'medium',
  toolbar,
  pagination,
  sort,
  onSortChange,
  getRowStatus,
}: DataTableProps<T>) {
  const hasRows = rows.length > 0;

  return (
    <Paper
      sx={{
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
      }}
    >
      {toolbar}

      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-thumb': { borderRadius: 999, backgroundColor: 'divider' } }}>
        <Table stickyHeader={stickyHeader} size={size} sx={{ minWidth: { xs: Math.min(minWidth, 680), md: minWidth } }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    minWidth: column.minWidth,
                    width: column.width,
                    ...column.headerSx,
                  }}
                >
                  {column.sortField && onSortChange ? (
                    <TableSortLabel
                      active={sort?.field === column.sortField}
                      direction={sort?.field === column.sortField ? sort.direction : 'asc'}
                      onClick={() =>
                        onSortChange({
                          field: column.sortField as string,
                          direction:
                            sort?.field === column.sortField && sort.direction === 'asc'
                              ? 'desc'
                              : 'asc',
                        })
                      }
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {column.header}
                      </Typography>
                    </TableSortLabel>
                  ) : (
                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {column.header}
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading
              ? Array.from({ length: 6 }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {columns.map((column, columnIndex) => (
                      <TableCell
                        key={`${column.id}-skeleton-${rowIndex}`}
                        align={column.align}
                        sx={{
                          minWidth: column.minWidth,
                          width: column.width,
                          whiteSpace: column.nowrap ? 'nowrap' : 'normal',
                          ...column.cellSx,
                        }}
                      >
                        <Skeleton
                          variant="text"
                          width={columnIndex === columns.length - 1 ? 72 : `${Math.max(45, 88 - columnIndex * 8)}%`}
                          height={24}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {!loading && error ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box sx={{ py: 1 }}>
                    <ErrorState
                      title={errorTitle}
                      description={errorDescription}
                      onRetry={onRetry}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && !error && !hasRows ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box sx={{ py: 1 }}>
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && !error && hasRows
              ? rows.map((row, index) => {
                  const rowKey = getRowId ? getRowId(row, index) : index;
                  const rowStatus = getRowStatus?.(row);
                  const rowStatusTone = rowStatus ? getStatusConfig(rowStatus).tone : null;

                  return (
                    <TableRow
                      key={rowKey}
                      hover
                      tabIndex={0}
                      sx={(theme) => {
                        const toneColor = rowStatusTone === 'success'
                          ? theme.palette.success.main
                          : rowStatusTone === 'warning'
                            ? theme.palette.warning.main
                            : rowStatusTone === 'error'
                              ? theme.palette.error.main
                              : rowStatusTone === 'info'
                                ? theme.palette.info.main
                                : rowStatusTone === 'primary'
                                  ? theme.palette.primary.main
                                  : rowStatusTone === 'neutral'
                                    ? theme.palette.text.secondary
                                    : null;

                        return {
                          '&:last-child td': {
                            borderBottom: 0,
                          },
                          '&:focus-visible': {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: -2,
                          },
                          ...(toneColor
                            ? {
                                '& td:first-of-type': {
                                  borderLeft: `3px solid ${toneColor}`,
                                },
                              }
                            : {}),
                          ...(rowStatusTone === 'warning' || rowStatusTone === 'error'
                            ? {
                                backgroundColor: alpha(toneColor ?? theme.palette.text.primary, 0.035),
                              }
                            : {}),
                        };
                      }}
                    >
                      {columns.map((column) => {
                        const content = column.render
                          ? column.render(row)
                          : column.accessor
                            ? formatCellValue(row[column.accessor])
                            : '—';

                        return (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            sx={{
                              whiteSpace: column.nowrap ? 'nowrap' : 'normal',
                              ...column.cellSx,
                            }}
                          >
                            {content}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              : null}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination}
    </Paper>
  );
}
