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