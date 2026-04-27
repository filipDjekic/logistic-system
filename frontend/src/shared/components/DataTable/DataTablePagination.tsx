import TablePagination from '@mui/material/TablePagination';

type DataTablePaginationProps = {
  page: number;
  rowsPerPage: number;
  count: number;
  rowsPerPageOptions?: number[];
  onPageChange: (_event: unknown, nextPage: number) => void;
  onRowsPerPageChange: (nextRowsPerPage: number) => void;
};

export default function DataTablePagination({
  page,
  rowsPerPage,
  count,
  rowsPerPageOptions = [5, 10, 20, 50],
  onPageChange,
  onRowsPerPageChange,
}: DataTablePaginationProps) {
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
      page={page}
      count={count}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={rowsPerPageOptions}
      onPageChange={onPageChange}
      onRowsPerPageChange={(event) => {
        onRowsPerPageChange(Number(event.target.value));
      }}
    />
  );
}
