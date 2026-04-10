import { useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import ChangeHistoryTable from '../components/ChangeHistoryTable';
import { useChangeHistory } from '../hooks/useChangeHistory';
import {
  changeTypeOptions,
  type ChangeHistoryFiltersState,
} from '../types/changeHistory.types';

export default function ChangeHistoryPage() {
  const [filters, setFilters] = useState<ChangeHistoryFiltersState>({
    search: '',
    changeType: 'ALL',
    entityName: '',
    userId: '',
  });

  const changeHistoryQuery = useChangeHistory(true);

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedEntityName = useDebounce(filters.entityName, 300);
  const debouncedUserId = useDebounce(filters.userId, 300);

  const filteredRows = useMemo(() => {
    const rows = changeHistoryQuery.data ?? [];
    const search = debouncedSearch.trim().toLowerCase();
    const entityName = debouncedEntityName.trim().toLowerCase();
    const userId = debouncedUserId.trim();

    return rows.filter((row) => {
      const matchesChangeType =
        filters.changeType === 'ALL' || row.changeType === filters.changeType;

      const matchesEntityName =
        entityName.length === 0 || row.entityName.toLowerCase().includes(entityName);

      const matchesUserId =
        userId.length === 0 || String(row.userId).includes(userId);

      const matchesSearch =
        search.length === 0 ||
        row.entityName.toLowerCase().includes(search) ||
        row.changeType.toLowerCase().includes(search) ||
        (row.fieldName ?? '').toLowerCase().includes(search) ||
        (row.oldValue ?? '').toLowerCase().includes(search) ||
        (row.newValue ?? '').toLowerCase().includes(search) ||
        String(row.id).includes(search) ||
        String(row.entityId).includes(search) ||
        String(row.userId).includes(search);

      return matchesChangeType && matchesEntityName && matchesUserId && matchesSearch;
    });
  }, [
    changeHistoryQuery.data,
    debouncedEntityName,
    debouncedSearch,
    debouncedUserId,
    filters.changeType,
  ]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Administration"
        title="Change History"
        description="Review confirmed backend change history records for important entity updates."
      />

      <SectionCard
        title="Change history list"
        description="Current backend confirms entity name, entity ID, change type, field name, old/new value and user ID."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by entity, change type, field, values or IDs"
              fullWidth
            />

            <TextField
              select
              size="small"
              label="Change type"
              value={filters.changeType}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  changeType: event.target.value as ChangeHistoryFiltersState['changeType'],
                }))
              }
              sx={{ minWidth: { xs: '100%', lg: 190 } }}
            >
              <MenuItem value="ALL">All</MenuItem>
              {changeTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Entity name"
              value={filters.entityName}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, entityName: event.target.value }))
              }
              sx={{ minWidth: { xs: '100%', lg: 200 } }}
            />

            <TextField
              size="small"
              label="User ID"
              value={filters.userId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, userId: event.target.value }))
              }
              sx={{ minWidth: { xs: '100%', lg: 140 } }}
            />

            <Button
              variant="outlined"
              onClick={() => {
                void changeHistoryQuery.refetch();
              }}
              disabled={changeHistoryQuery.isFetching}
            >
              Refresh
            </Button>
          </Stack>

          <ChangeHistoryTable
            rows={filteredRows}
            loading={changeHistoryQuery.isLoading}
            error={changeHistoryQuery.isError}
            onRetry={() => {
              void changeHistoryQuery.refetch();
            }}
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}