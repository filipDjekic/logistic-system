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
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        '& .MuiTablePagination-toolbar': {
          px: { xs: 1, sm: 2 },
          minHeight: { xs: 52, sm: 56 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          rowGap: 0.5,
        },
        '& .MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
        '& .MuiTablePagination-selectLabel': { display: { xs: 'none', sm: 'block' } },
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
          m: 0,
          fontSize: { xs: 12, sm: 13 },
        },
        '& .MuiTablePagination-actions': { ml: { xs: 'auto', sm: 2 } },
      }}
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
