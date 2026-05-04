import { useMemo, useState } from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import ShiftsTable from '../components/ShiftsTable';
import { useMyShifts } from '../hooks/useMyShifts';
import type { ShiftFiltersState } from '../types/shift.types';
import { shiftStatusOptions } from '../validation/shiftSchema';

export default function MyShiftsPage() {
  const [filters, setFilters] = useState<ShiftFiltersState>({
    search: '',
    status: 'ALL',
  });

  const myShiftsQuery = useMyShifts(true);

  const filteredRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (myShiftsQuery.data ?? []).filter((shift) => {
      const matchesStatus = filters.status === 'ALL' || shift.status === filters.status;
      const matchesSearch =
        search.length === 0 ||
        shift.notes.toLowerCase().includes(search) ||
        shift.status.toLowerCase().includes(search) ||
        String(shift.id).includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [filters, myShiftsQuery.data]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Workforce"
        title="My shifts"
        description="View your assigned shifts."
      />

      <TableLayout
        title="Assigned shifts"
        description="This page uses the dedicated backend endpoint for the authenticated user."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            searchPlaceholder="Search by status, notes or shift ID"
            onRefresh={() => { void myShiftsQuery.refetch(); }}
            refreshDisabled={myShiftsQuery.isFetching}
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
          <ShiftsTable
            rows={filteredRows}
            loading={myShiftsQuery.isLoading}
            error={myShiftsQuery.isError}
            onRetry={() => { void myShiftsQuery.refetch(); }}
            showEmployeeColumn={false}
            showActions={false}
            emptyTitle="No assigned shifts"
            emptyDescription="You do not have any shifts in the current view."
          />
        }
      />
    </Stack>
  );
}