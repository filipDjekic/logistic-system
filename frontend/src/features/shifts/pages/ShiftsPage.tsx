import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { shiftsApi } from '../api/shiftsApi';
import ShiftFormDialog from '../components/ShiftFormDialog';
import ShiftsTable from '../components/ShiftsTable';
import { useCreateShift } from '../hooks/useCreateShift';
import { useShifts } from '../hooks/useShifts';
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

  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedShift, setSelectedShift] = useState<ShiftResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const shiftsQuery = useShifts(true);
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

    return (shiftsQuery.data ?? []).filter((shift) => {
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

      <SectionCard
        title="Shift list"
        description="Only confirmed backend operations are exposed here."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by employee, status, notes or shift ID"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Status"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as ShiftFiltersState['status'],
                }))
              }
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {shiftStatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              onClick={() => {
                void Promise.all([
                  shiftsQuery.refetch(),
                  employeesQuery.refetch(),
                ]);
              }}
              disabled={shiftsQuery.isFetching || employeesQuery.isFetching}
            >
              Refresh
            </Button>
          </Stack>

          <ShiftsTable
            rows={filteredRows}
            employeesById={employeesById}
            loading={shiftsQuery.isLoading || employeesQuery.isLoading}
            error={shiftsQuery.isError || employeesQuery.isError}
            onRetry={() => {
              void Promise.all([
                shiftsQuery.refetch(),
                employeesQuery.refetch(),
              ]);
            }}
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
        </Stack>
      </SectionCard>

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