import { useEffect, useMemo, useState } from 'react';
import { Stack, TextField } from '@mui/material';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import TableToolbar from '../../../shared/components/TableToolbar/TableToolbar';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import ActivityLogsTable from '../components/ActivityLogsTable';
import { useActivityLogs } from '../hooks/useActivityLogs';
import type { ActivityLogFiltersState, ActivityLogQueryParams } from '../types/activityLog.types';

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState<ActivityLogFiltersState>({
    search: '',
    action: '',
    entityName: '',
    userId: '',
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedAction = useDebounce(filters.action, 300);
  const debouncedEntityName = useDebounce(filters.entityName, 300);
  const debouncedUserId = useDebounce(filters.userId, 300);

  const queryParams = useMemo<ActivityLogQueryParams>(() => {
    const params: ActivityLogQueryParams = {};

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (debouncedAction.trim()) {
      params.action = debouncedAction.trim();
    }

    if (debouncedEntityName.trim()) {
      params.entityName = debouncedEntityName.trim();
    }

    if (debouncedUserId.trim() && Number.isFinite(Number(debouncedUserId))) {
      params.userId = Number(debouncedUserId);
    }

    return params;
  }, [debouncedAction, debouncedEntityName, debouncedSearch, debouncedUserId]);

  useEffect(() => {
    setPage(0);
  }, [queryParams]);

  const activityLogsQuery = useActivityLogs({
    ...queryParams,
    page,
    size,
    sort: buildSortParam({ field: 'createdAt', direction: 'desc' }),
  });

  const handleSizeChange = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const clearFilters = () => {
    setFilters({ search: '', action: '', entityName: '', userId: '' });
  };

  const hasFilters = Boolean(filters.search || filters.action || filters.entityName || filters.userId);

  return (
    <Stack spacing={3}>
      <PageHeader overline="Administration" title="Activity Logs" description="Review backend activity records." />

      <TableLayout
        title="Activity log list"
        description="Use search, filters, and server pagination for audit review."
        toolbar={
          <TableToolbar
            searchValue={filters.search}
            onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
            searchPlaceholder="Search by action, entity, or description"
            onRefresh={() => { void activityLogsQuery.refetch(); }}
            refreshDisabled={activityLogsQuery.isFetching}
            onClearFilters={clearFilters}
            clearDisabled={!hasFilters}
          />
        }
        filters={
          <FilterPanel>
            <TextField size="small" label="Action" value={filters.action} onChange={(event) => setFilters((prev) => ({ ...prev, action: event.target.value }))} sx={{ minWidth: { xs: '100%', lg: 180 } }} />
            <TextField size="small" label="Entity name" value={filters.entityName} onChange={(event) => setFilters((prev) => ({ ...prev, entityName: event.target.value }))} sx={{ minWidth: { xs: '100%', lg: 200 } }} />
            <TextField size="small" label="User ID" value={filters.userId} onChange={(event) => setFilters((prev) => ({ ...prev, userId: event.target.value }))} sx={{ minWidth: { xs: '100%', lg: 140 } }} />
          </FilterPanel>
        }
        table={
          <ActivityLogsTable
            rows={activityLogsQuery.data?.content ?? []}
            loading={activityLogsQuery.isLoading}
            error={activityLogsQuery.isError}
            onRetry={() => { void activityLogsQuery.refetch(); }}
            pagination={<ServerTablePagination page={activityLogsQuery.data} disabled={activityLogsQuery.isFetching} onPageChange={setPage} onSizeChange={handleSizeChange} />}
          />
        }
      />
    </Stack>
  );
}
