import { useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import EmptyState from '../../../shared/components/EmptyState/EmptyState';
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

function getInitialFilters(searchParams: URLSearchParams): ChangeHistoryFiltersState {
  const rawChangeType = searchParams.get('changeType');
  const changeType = changeTypeOptions.includes(rawChangeType as never)
    ? (rawChangeType as ChangeHistoryFiltersState['changeType'])
    : 'ALL';

  return {
    search: searchParams.get('search') ?? '',
    changeType,
    entityName: searchParams.get('entityName') ?? '',
    entityId: searchParams.get('entityId') ?? '',
    userId: searchParams.get('userId') ?? '',
  };
}

export default function ChangeHistoryPage() {
  const auth = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ChangeHistoryFiltersState>(() => getInitialFilters(searchParams));

  const isOverlord = auth.user?.role === ROLES.OVERLORD;

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedEntityName = useDebounce(filters.entityName, 300);
  const debouncedEntityId = useDebounce(filters.entityId, 300);
  const debouncedUserId = useDebounce(filters.userId, 300);

  const contextEntityName = debouncedEntityName.trim();
  const contextEntityId =
    debouncedEntityId.trim().length > 0 && Number.isFinite(Number(debouncedEntityId))
      ? Number(debouncedEntityId)
      : null;
  const contextUserId =
    debouncedUserId.trim().length > 0 && Number.isFinite(Number(debouncedUserId))
      ? Number(debouncedUserId)
      : null;

  const isContextView = Boolean(contextEntityName || contextEntityId != null || contextUserId != null);

  const changeHistoryQuery = useChangeHistory(
    {
      entityName: contextEntityName || undefined,
      entityId: contextEntityId,
      userId: contextUserId,
    },
    isOverlord || isContextView,
  );

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (filters.search.trim()) {
      nextParams.set('search', filters.search.trim());
    }

    if (filters.changeType !== 'ALL') {
      nextParams.set('changeType', filters.changeType);
    }

    if (filters.entityName.trim()) {
      nextParams.set('entityName', filters.entityName.trim());
    }

    if (filters.entityId.trim()) {
      nextParams.set('entityId', filters.entityId.trim());
    }

    if (filters.userId.trim()) {
      nextParams.set('userId', filters.userId.trim());
    }

    setSearchParams(nextParams, { replace: true });
  }, [filters, setSearchParams]);

  const filteredRows = useMemo(() => {
    const rows = changeHistoryQuery.data ?? [];
    const search = debouncedSearch.trim().toLowerCase();
    const entityName = contextEntityName.toLowerCase();
    const entityId = debouncedEntityId.trim();
    const userId = debouncedUserId.trim();

    return rows.filter((row) => {
      const matchesChangeType =
        filters.changeType === 'ALL' || row.changeType === filters.changeType;

      const matchesEntityName =
        entityName.length === 0 || row.entityName.toLowerCase().includes(entityName);

      const matchesEntityId =
        entityId.length === 0 || String(row.entityId).includes(entityId);

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

      return (
        matchesChangeType &&
        matchesEntityName &&
        matchesEntityId &&
        matchesUserId &&
        matchesSearch
      );
    });
  }, [
    changeHistoryQuery.data,
    contextEntityName,
    debouncedEntityId,
    debouncedSearch,
    debouncedUserId,
    filters.changeType,
  ]);

  if (!isOverlord && !isContextView) {
    return (
      <Stack spacing={3}>
        <PageHeader
          overline="Entity context"
          title="Change History"
          description="This page is available to non-OVERLORD roles only through entity context."
          actions={
            <Button variant="outlined" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
          }
        />

        <SectionCard
          title="Context required"
          description="Open history from a specific details page so access stays tied to the selected entity."
        >
          <EmptyState
            title="Select history from entity details"
            description="Use View history from user, employee, vehicle, warehouse, product, task or transport order details."
          />
        </SectionCard>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        overline={isContextView ? 'Entity context' : 'Administration'}
        title="Change History"
        description={
          isContextView
            ? 'Review change history for the selected entity context.'
            : 'Review confirmed backend change history records for important entity updates.'
        }
      />

      <SectionCard
        title="Change history list"
        description="History results are filtered again in the backend by entity access, not only by company."
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

            {isOverlord ? (
              <>
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
                  label="Entity ID"
                  value={filters.entityId}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, entityId: event.target.value }))
                  }
                  sx={{ minWidth: { xs: '100%', lg: 140 } }}
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
              </>
            ) : (
              <>
                {filters.entityName ? (
                  <TextField
                    size="small"
                    label="Entity name"
                    value={filters.entityName}
                    InputProps={{ readOnly: true }}
                    sx={{ minWidth: { xs: '100%', lg: 200 } }}
                  />
                ) : null}

                {filters.entityId ? (
                  <TextField
                    size="small"
                    label="Entity ID"
                    value={filters.entityId}
                    InputProps={{ readOnly: true }}
                    sx={{ minWidth: { xs: '100%', lg: 140 } }}
                  />
                ) : null}

                {filters.userId ? (
                  <TextField
                    size="small"
                    label="User ID"
                    value={filters.userId}
                    InputProps={{ readOnly: true }}
                    sx={{ minWidth: { xs: '100%', lg: 140 } }}
                  />
                ) : null}
              </>
            )}

            <Button
              variant="outlined"
              onClick={() => {
                void changeHistoryQuery.refetch();
              }}
              disabled={changeHistoryQuery.isFetching}
            >
              Refresh
            </Button>

            <Button
              variant="text"
              onClick={() => {
                if (isOverlord) {
                  setFilters({
                    search: '',
                    changeType: 'ALL',
                    entityName: '',
                    entityId: '',
                    userId: '',
                  });
                  return;
                }

                setFilters((prev) => ({
                  search: '',
                  changeType: 'ALL',
                  entityName: prev.entityName,
                  entityId: prev.entityId,
                  userId: prev.userId,
                }));
              }}
            >
              Clear
            </Button>
          </Stack>

          <ChangeHistoryTable
            rows={filteredRows}
            loading={changeHistoryQuery.isLoading}
            error={changeHistoryQuery.isError}
            onRetry={() => void changeHistoryQuery.refetch()}
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}