import { useEffect, useMemo, useState } from 'react';
import { Button, Stack, TextField } from '@mui/material';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import SearchToolbar from '../../../shared/components/SearchToolbar/SearchToolbar';
import SectionCard from '../../../shared/components/SectionCard/SectionCard';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
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

  return (
    <Stack spacing={3}>
      <PageHeader
        overline="Administration"
        title="Activity Logs"
        description="Review backend activity records."
      />

      <SectionCard
        title="Activity log list"
        description="Use search, filters, and server pagination for audit review."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
            <SearchToolbar
              value={filters.search}
              onChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
              placeholder="Search by action, entity, or description"
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
            rows={activityLogsQuery.data?.content ?? []}
            loading={activityLogsQuery.isLoading}
            error={activityLogsQuery.isError}
            onRetry={() => {
              void activityLogsQuery.refetch();
            }}
            pagination={
              <ServerTablePagination
                page={activityLogsQuery.data}
                disabled={activityLogsQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            }
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}
