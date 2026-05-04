import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { shiftsApi } from '../api/shiftsApi';
import ShiftFormDialog from '../components/ShiftFormDialog';
import ShiftsTable from '../components/ShiftsTable';
import { useCreateShift } from '../hooks/useCreateShift';
import { useShifts } from '../hooks/useShifts';
import type { SortState } from '../../../shared/types/common.types';
import type {
  ShiftFiltersState,
  ShiftResponse,
} from '../types/shift.types';
import { shiftStatusOptions } from '../validation/shiftSchema';

export default function ShiftsPage() {
  const [filters, setFilters] = useState<ShiftFiltersState>({
    search: '',
    status: 'ALL',
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort] = useState<SortState>({ field: 'startTime', direction: 'desc' });

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedShift, setSelectedShift] = useState<ShiftResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const shiftsQuery = useShifts({ page, size, sort: buildSortParam(sort) }, true);
  const employeesQuery = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: shiftsApi.getEmployees,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const saveShiftMutation = useCreateShift();

  const employeesById = useMemo(
    () =>
      Object.fromEntries((employeesQuery.data ?? []).map((employee) => [employee.id, employee])),
    [employeesQuery.data],
  );

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (shiftsQuery.data?.content ?? []).filter((shift) => {
      const employee = employeesById[shift.employeeId];
      const employeeLabel = employee
        ? `${employee.firstName} ${employee.lastName} ${employee.email}`.toLowerCase()
        : `employee ${shift.employeeId}`;

      const matchesStatus = filters.status === 'ALL' || shift.status === filters.status;
      const matchesSearch =
        search.length === 0 ||
        (shift.notes ?? '').toLowerCase().includes(search) ||
        shift.status.toLowerCase().includes(search) ||
        employeeLabel.includes(search) ||
        String(shift.id).includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [employeesById, filters, shiftsQuery.data]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Workforce"
        title="Shifts"
        description="Plan and review employee shifts."
        actions={
          <Button
            variant="contained"
            onClick={() => {
              setDialogMode('create');
              setSelectedShift(null);
              setDialogOpen(true);
            }}
          >
            Create shift
          </Button>
        }
      />

      <TableLayout
        title="Shift list"
        description="Only confirmed backend operations are exposed here."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            searchPlaceholder="Search by employee, status, notes or shift ID"
            onRefresh={() => { void Promise.all([shiftsQuery.refetch(), employeesQuery.refetch()]); }}
            refreshDisabled={shiftsQuery.isFetching || employeesQuery.isFetching}
          />
        }
        filters={
          <FilterPanel minColumnWidth={180}>
            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value as ShiftFiltersState['status'] }))}
            >
              <MenuItem value="ALL">All</MenuItem>
              {shiftStatusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
            </TextField>
          </FilterPanel>
        }
        table={
          <>
            <ShiftsTable
              rows={filteredRows}
              employeesById={employeesById}
              loading={shiftsQuery.isLoading || employeesQuery.isLoading}
              error={shiftsQuery.isError || employeesQuery.isError}
              onRetry={() => { void Promise.all([shiftsQuery.refetch(), employeesQuery.refetch()]); }}
              onEdit={(shift) => {
                setDialogMode('edit');
                setSelectedShift(shift);
                setDialogOpen(true);
              }}
              showEmployeeColumn
              showActions
              emptyTitle="No shifts found"
              emptyDescription="There are no shifts for the current filter combination."
            />
            <ServerTablePagination
              page={shiftsQuery.data}
              disabled={shiftsQuery.isFetching}
              onPageChange={setPage}
              onSizeChange={(nextSize) => { setPage(0); setSize(nextSize); }}
            />
          </>
        }
      />

      <ShiftFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initialData={selectedShift}
        employees={employeesQuery.data ?? []}
        loading={saveShiftMutation.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmit={(values) => {
          if (dialogMode === 'create') {
            saveShiftMutation.mutate({
              mode: 'create',
              data: {
                startTime: values.startTime,
                endTime: values.endTime,
                status: 'PLANNED',
                notes: values.notes,
                employeeId: Number(values.employeeId),
              },
            });
            return;
          }

          if (!selectedShift) {
            return;
          }

          saveShiftMutation.mutate({
            mode: 'edit',
            id: selectedShift.id,
            data: {
              startTime: values.startTime,
              endTime: values.endTime,
              status: values.status,
              notes: values.notes,
            },
          });
        }}
      />
    </Stack>
  );
}