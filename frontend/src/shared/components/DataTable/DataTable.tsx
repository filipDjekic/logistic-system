import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
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
import { readStoredTableDensity, TABLE_DENSITY_CHANGED_EVENT, type TableDensity } from '../TableToolbar/TableDensityControl';

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
  stickyActions?: boolean;
  size?: 'small' | 'medium';
  density?: TableDensity;
  toolbar?: ReactNode;
  pagination?: ReactNode;
  renderMobileCard?: (row: T) => ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  getRowStatus?: (row: T) => string | null | undefined;
  onRowClick?: (row: T) => void;
  rowClickLabel?: string;
  enableClientWindowing?: boolean;
  windowingThreshold?: number;
  maxRenderedRows?: number;
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
  stickyHeader = true,
  stickyActions = true,
  size,
  density,
  toolbar,
  pagination,
  renderMobileCard,
  sort,
  onSortChange,
  getRowStatus,
  onRowClick,
  rowClickLabel = 'Open details',
  enableClientWindowing = true,
  windowingThreshold = 150,
  maxRenderedRows = 90,
}: DataTableProps<T>) {
  const [storedDensity, setStoredDensity] = useState<TableDensity>(() => readStoredTableDensity());
  const effectiveDensity = density ?? storedDensity;
  const effectiveSize = size ?? (effectiveDensity === 'compact' ? 'small' : 'medium');

  useEffect(() => {
    const handleDensityChange = () => setStoredDensity(readStoredTableDensity());

    window.addEventListener(TABLE_DENSITY_CHANGED_EVENT, handleDensityChange);
    window.addEventListener('storage', handleDensityChange);

    return () => {
      window.removeEventListener(TABLE_DENSITY_CHANGED_EVENT, handleDensityChange);
      window.removeEventListener('storage', handleDensityChange);
    };
  }, []);

  const hasRows = rows.length > 0;
  const showMobileCards = Boolean(renderMobileCard);
  const [scrollTop, setScrollTop] = useState(0);
  const estimatedRowHeight = effectiveSize === 'small' ? 44 : 56;
  const shouldWindowRows = enableClientWindowing && !loading && !error && rows.length > windowingThreshold;
  const windowState = useMemo(() => {
    if (!shouldWindowRows) {
      return { start: 0, end: rows.length, topPadding: 0, bottomPadding: 0, visibleRows: rows };
    }

    const overscan = 12;
    const start = Math.max(0, Math.floor(scrollTop / estimatedRowHeight) - overscan);
    const end = Math.min(rows.length, start + maxRenderedRows);
    return {
      start,
      end,
      topPadding: start * estimatedRowHeight,
      bottomPadding: Math.max(0, (rows.length - end) * estimatedRowHeight),
      visibleRows: rows.slice(start, end),
    };
  }, [estimatedRowHeight, error, loading, maxRenderedRows, rows, scrollTop, shouldWindowRows, windowingThreshold]);

  const isInteractiveTarget = (target: EventTarget | null, currentRow: HTMLTableRowElement) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const interactiveElement = target.closest('button, a, input, textarea, select, [role="button"], [data-row-action="true"]');
    return Boolean(interactiveElement && interactiveElement !== currentRow);
  };

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick || isInteractiveTarget(event.target, event.currentTarget)) {
      return;
    }

    onRowClick(row);
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick || isInteractiveTarget(event.target, event.currentTarget)) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(row);
    }
  };

  const getStickySx = (column: DataTableColumn<T>, isHead = false): SxProps<Theme> | undefined => {
    const sticky = column.sticky === 'right' || (stickyActions && column.id === 'actions');
    if (!sticky) {
      return undefined;
    }

    return {
      position: 'sticky',
      right: 0,
      zIndex: isHead ? 4 : 3,
      backgroundColor: isHead ? 'background.paper' : 'background.default',
      boxShadow: (theme) => `-1px 0 0 ${theme.palette.divider}`,
    };
  };

  return (
    <Paper
      sx={{
        overflow: 'hidden',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        minWidth: 0,
      }}
    >
      {toolbar}

      {renderMobileCard && !loading && !error && hasRows ? (
        <Box
          sx={{
            display: { xs: 'grid', md: 'none' },
            gap: 1.25,
            p: 1.25,
          }}
        >
          {rows.map((row, index) => (
            <Box key={getRowId ? getRowId(row, index) : index}>
              {renderMobileCard(row)}
            </Box>
          ))}
        </Box>
      ) : null}

      <TableContainer
        onScroll={(event) => {
          if (shouldWindowRows) {
            setScrollTop(event.currentTarget.scrollTop);
          }
        }}
        sx={{
          display: showMobileCards && hasRows && !loading && !error ? { xs: 'none', md: 'block' } : 'block',
          maxWidth: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorX: 'contain',
          ...(shouldWindowRows ? { maxHeight: { xs: 520, md: 720 }, overflowY: 'auto' } : {}),
          '&::-webkit-scrollbar': { height: 8 },
          '&::-webkit-scrollbar-thumb': { borderRadius: 999, backgroundColor: 'divider' },
        }}
      >
        <Table
          stickyHeader={stickyHeader}
          size={effectiveSize}
          sx={{
            minWidth: { xs: Math.min(minWidth, 760), md: minWidth },
            '& td, & th': { verticalAlign: 'top' },
            ...(effectiveDensity === 'compact'
              ? {
                  '& .MuiTableCell-root': { py: 0.75 },
                }
              : {}),
          }}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  sx={{
                    ...(column.minWidth != null ? { minWidth: column.minWidth } : {}),
                    ...(column.width != null ? { width: column.width } : {}),
                    ...getStickySx(column, true),
                    ...(column.headerSx as object),
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
                            sort?.field === column.sortField && sort?.direction === 'asc'
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
                          ...(column.minWidth != null ? { minWidth: column.minWidth } : {}),
                          ...(column.width != null ? { width: column.width } : {}),
                          whiteSpace: column.nowrap ? 'nowrap' : 'normal',
                          ...getStickySx(column),
                          ...(column.cellSx as object),
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
                  <Box sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
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
                  <Box sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && !error && shouldWindowRows && windowState.topPadding > 0 ? (
              <TableRow aria-hidden="true">
                <TableCell colSpan={columns.length} sx={{ p: 0, border: 0, height: windowState.topPadding }} />
              </TableRow>
            ) : null}

            {!loading && !error && hasRows
              ? windowState.visibleRows.map((row, visibleIndex) => {
                  const index = windowState.start + visibleIndex;
                  const rowKey = getRowId ? getRowId(row, index) : index;
                  const rowStatus = getRowStatus?.(row);
                  const rowStatusTone = rowStatus ? getStatusConfig(rowStatus).tone : null;

                  return (
                    <TableRow
                      key={rowKey}
                      hover
                      role={onRowClick ? 'button' : undefined}
                      aria-label={onRowClick ? `${rowClickLabel}` : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={(event) => handleRowClick(event, row)}
                      onKeyDown={(event) => handleRowKeyDown(event, row)}
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
                          cursor: onRowClick ? 'pointer' : 'default',
                          transition: theme.transitions.create(['background-color', 'box-shadow'], { duration: theme.transitions.duration.shortest }),
                          '&:hover': onRowClick ? {
                            backgroundColor: alpha(theme.palette.primary.main, 0.035),
                          } : undefined,
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
                              maxWidth: column.nowrap ? undefined : { xs: 280, md: 'none' },
                              overflowWrap: 'anywhere',
                              ...getStickySx(column),
                              ...(column.cellSx as object),
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

            {!loading && !error && shouldWindowRows && windowState.bottomPadding > 0 ? (
              <TableRow aria-hidden="true">
                <TableCell colSpan={columns.length} sx={{ p: 0, border: 0, height: windowState.bottomPadding }} />
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination ? (
        <Box sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
          {pagination}
        </Box>
      ) : null}
    </Paper>
  );
}
