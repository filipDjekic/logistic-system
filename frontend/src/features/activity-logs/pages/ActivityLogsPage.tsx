import { useMemo, useState } from 'react';
import { Button, Stack, TextField } from '@mui/material';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import ActivityLogsTable from '../components/ActivityLogsTable';
import { useActivityLogs } from '../hooks/useActivityLogs';
import type { ActivityLogFiltersState } from '../types/activityLog.types';

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState<ActivityLogFiltersState>({
    search: '',
    action: '',
    entityName: '',
    userId: '',
  });

  const activityLogsQuery = useActivityLogs(true);

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedAction = useDebounce(filters.action, 300);
  const debouncedEntityName = useDebounce(filters.entityName, 300);
  const debouncedUserId = useDebounce(filters.userId, 300);

  const filteredRows = useMemo(() => {
    const rows = activityLogsQuery.data ?? [];
    const search = debouncedSearch.trim().toLowerCase();
    const action = debouncedAction.trim().toLowerCase();
    const entityName = debouncedEntityName.trim().toLowerCase();
    const userId = debouncedUserId.trim();

    return rows.filter((row) => {
      const matchesAction =
        action.length === 0 || row.action.toLowerCase().includes(action);

      const matchesEntityName =
        entityName.length === 0 || row.entityName.toLowerCase().includes(entityName);

      const matchesUserId =
        userId.length === 0 || String(row.userId).includes(userId);

      const matchesSearch =
        search.length === 0 ||
        row.action.toLowerCase().includes(search) ||
        row.entityName.toLowerCase().includes(search) ||
        (row.description ?? '').toLowerCase().includes(search) ||
        String(row.id).includes(search) ||
        String(row.entityId ?? '').includes(search) ||
        String(row.userId).includes(search) ||
        row.createdAt.toLowerCase().includes(search);

      return matchesAction && matchesEntityName && matchesUserId && matchesSearch;
    });
  }, [
    activityLogsQuery.data,
    debouncedAction,
    debouncedEntityName,
    debouncedSearch,
    debouncedUserId,
  ]);

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Administration"
        title="Activity Logs"
        description="Review confirmed backend activity log records for administrative auditing."
      />

      <SectionCard
        title="Activity log list"
        description="Current backend confirms admin-only read access and returns action, entity name, entity ID, description, created time and user ID."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by action, entity, description, IDs or timestamp"
              fullWidth
            />

            <TextField
              size="small"
              label="Action"
              value={filters.action}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, action: event.target.value }))
              }
              sx={{ minWidth: { xs: '100%', lg: 180 } }}
            />

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
                void activityLogsQuery.refetch();
              }}
              disabled={activityLogsQuery.isFetching}
            >
              Refresh
            </Button>
          </Stack>

          <ActivityLogsTable
            rows={filteredRows}
            loading={activityLogsQuery.isLoading}
            error={activityLogsQuery.isError}
            onRetry={() => {
              void activityLogsQuery.refetch();
            }}
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}