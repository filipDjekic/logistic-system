import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import type { TableCellProps } from '@mui/material/TableCell';

export type RowId = string | number;
export type Nullable<T> = T | null;

export type PaginationState = {
  page: number;
  size: number;
};

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  accessor?: keyof T;
  align?: TableCellProps['align'];
  width?: number | string;
  minWidth?: number;
  nowrap?: boolean;
  headerSx?: SxProps<Theme>;
  cellSx?: SxProps<Theme>;
  render?: (row: T) => ReactNode;
};