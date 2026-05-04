import DataTable from '../../../shared/components/DataTable/DataTable';
import type { DataTableColumn, RowId } from '../../../shared/types/common.types';

type ReportDataTableProps<T> = {
  title: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T, index: number) => RowId;
  minWidth?: number;
  emptyDescription?: string;
};

export default function ReportDataTable<T>({
  title,
  rows,
  columns,
  getRowId,
  minWidth = 900,
  emptyDescription = 'There are no rows for the current report filters.',
}: ReportDataTableProps<T>) {
  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={getRowId}
      emptyTitle={`No ${title.toLowerCase()} found`}
      emptyDescription={emptyDescription}
      minWidth={minWidth}
      size="small"
    />
  );
}
