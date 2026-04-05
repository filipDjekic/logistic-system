import { useMemo, useState } from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
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

      <SectionCard
        title="Assigned shifts"
        description="This page uses the dedicated backend endpoint for the authenticated user."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by status, notes or shift ID"
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
          </Stack>

          <ShiftsTable
            rows={filteredRows}
            loading={myShiftsQuery.isLoading}
            error={myShiftsQuery.isError}
            onRetry={() => {
              void myShiftsQuery.refetch();
            }}
            showEmployeeColumn={false}
            showActions={false}
            emptyTitle="No assigned shifts"
            emptyDescription="You do not have any shifts in the current view."
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}