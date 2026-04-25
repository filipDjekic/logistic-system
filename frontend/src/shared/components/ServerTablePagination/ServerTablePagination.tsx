import { TablePagination } from '@mui/material';
import type { PageResponse } from '../../../core/api/pagination';

const rowsPerPageOptions = [10, 20, 50, 100];

type Props<T> = {
  page?: PageResponse<T>;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
};

export default function ServerTablePagination<T>({
  page,
  disabled = false,
  onPageChange,
  onSizeChange,
}: Props<T>) {
  return (
    <TablePagination
      component="div"
      count={page?.totalElements ?? 0}
      page={page?.number ?? 0}
      rowsPerPage={page?.size ?? 20}
      rowsPerPageOptions={rowsPerPageOptions}
      onPageChange={(_, nextPage) => {
        if (!disabled) {
          onPageChange(nextPage);
        }
      }}
      onRowsPerPageChange={(event) => {
        if (!disabled) {
          onSizeChange(Number(event.target.value));
        }
      }}
    />
  );
}
