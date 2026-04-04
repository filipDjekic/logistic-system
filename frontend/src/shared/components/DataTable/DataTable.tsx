import type { ReactNode } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import EmptyState from '../EmptyState/EmptyState';
import ErrorState from '../ErrorState/ErrorState';
import InlineLoader from '../Loader/InlineLoader';
import type { DataTableColumn, RowId } from '../../types/common.types';

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
}: DataTableProps<T>) {
  const hasRows = rows.length > 0;

  return (
    <Paper
      sx={{
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      {toolbar}

      <TableContainer>
        <Table stickyHeader={stickyHeader} size={size} sx={{ minWidth }}>
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
                  <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                    {column.header}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box sx={{ py: 3, px: 1 }}>
                    <InlineLoader message="Loading table data..." />
                  </Box>
                </TableCell>
              </TableRow>
            ) : null}

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

                  return (
                    <TableRow
                      key={rowKey}
                      hover
                      sx={{
                        '&:last-child td': {
                          borderBottom: 0,
                        },
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