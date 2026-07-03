import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../../shared/components/PageHeader/PageHeader';
import FilterPanel from '../../../shared/components/FilterPanel/FilterPanel';
import TableLayout from '../../../shared/components/TableLayout/TableLayout';
import DataTable from '../../../shared/components/DataTable/DataTable';
import ServerTablePagination from '../../../shared/components/ServerTablePagination/ServerTablePagination';
import { queryKeys } from '../../../core/constants/queryKeys';
import { useAuthStore } from '../../../core/auth/authStore';
import { ROLES } from '../../../core/constants/roles';
import { DEFAULT_PAGE_SIZE, buildSortParam } from '../../../core/api/pagination';
import { EntityLookupField, type LookupOption } from '../../lookup';
import { warehouseLocationsApi } from '../../warehouse-locations/api/warehouseLocationsApi';
import { inventoryCountsApi } from '../api/inventoryCountsApi';
import { useAppSnackbar } from '../../../app/providers/useSnackbar';
import type { DataTableColumn, SortState } from '../../../shared/types/common.types';
import type { InventoryCountSessionSummaryResponse } from '../types/inventoryCount.types';

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

export default function InventoryCountsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSnackbar } = useAppSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const auth = useAuthStore();
  const userRole = auth.user?.role ?? null;
  const isWorkerView = userRole === ROLES.WORKER;
  const canCreateInventoryCount = userRole === ROLES.OVERLORD || userRole === ROLES.WAREHOUSE_MANAGER;
  const [selectedWarehouse, setSelectedWarehouse] = useState<LookupOption | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState<LookupOption | null>(null);
  const [description, setDescription] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<SortState>({ field: 'createdAt', direction: 'desc' });

  const listParams = useMemo(
    () => ({
      page,
      size,
      sort: buildSortParam(sort),
      warehouseId: warehouseFilter?.id,
    }),
    [page, size, sort, warehouseFilter?.id],
  );

  const sessionsQuery = useQuery({
    queryKey: queryKeys.inventoryCounts.list(listParams),
    queryFn: () => inventoryCountsApi.getAll(listParams),
  });
  const zonesQuery = useQuery({
    queryKey: ['warehouse-locations', 'zones', { warehouseId: selectedWarehouse?.id }],
    queryFn: () => warehouseLocationsApi.zones({ warehouseId: selectedWarehouse!.id, size: 500 }),
    enabled: Boolean(selectedWarehouse?.id),
    staleTime: 30_000,
  });
  const binsQuery = useQuery({
    queryKey: ['warehouse-locations', 'bins', { warehouseId: selectedWarehouse?.id }],
    queryFn: () => warehouseLocationsApi.bins({ warehouseId: selectedWarehouse!.id, size: 1000 }),
    enabled: Boolean(selectedWarehouse?.id),
    staleTime: 30_000,
  });

  const zoneCount = zonesQuery.data?.totalElements ?? zonesQuery.data?.content?.length ?? 0;
  const binCount = binsQuery.data?.totalElements ?? binsQuery.data?.content?.length ?? 0;

  const handleSizeChange = (nextSize: number) => {
    setSize(nextSize);
    setPage(0);
  };

  const handleSortChange = (nextSort: SortState) => {
    setSort(nextSort);
    setPage(0);
  };

  const columns = useMemo<DataTableColumn<InventoryCountSessionSummaryResponse>[]>(
    () => [
      { id: 'code', header: 'Code', sortField: 'code', render: (session) => session.code, nowrap: true },
      { id: 'warehouse', header: 'Warehouse', sortField: 'warehouse.name', render: (session) => session.warehouseName },
      { id: 'status', header: 'Status', sortField: 'status', render: (session) => <Chip size="small" label={statusLabel(session.status)} /> },
      { id: 'lineCount', header: 'Lines', align: 'right', render: (session) => session.lineCount },
      { id: 'countedLineCount', header: 'Counted', align: 'right', render: (session) => session.countedLineCount },
      { id: 'discrepancyLineCount', header: 'Differences', align: 'right', render: (session) => session.discrepancyLineCount },
      {
        id: 'progress',
        header: 'Progress',
        align: 'right',
        render: (session) => `${session.lineCount ? Math.round((session.countedLineCount / session.lineCount) * 100) : 0}%`,
      },
      {
        id: 'actions',
        header: '',
        align: 'right',
        render: (session) => (
          <Button component={RouterLink} to={`/inventory-counts/${session.id}`} size="small" data-row-action="true">
            Open
          </Button>
        ),
      },
    ],
    [],
  );

  const createMutation = useMutation({
    mutationFn: inventoryCountsApi.create,
    onSuccess: (session) => {
      showSnackbar({ message: 'Inventory count session created.', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryCounts.root() });
      setDialogOpen(false);
      setSelectedWarehouse(null);
      setDescription('');
      navigate(`/inventory-counts/${session.id}`);
    },
  });

  return (
    <Stack spacing={2}>
      <PageHeader
        title={isWorkerView ? 'My Inventory Counts' : 'Inventory Counts'}
        description={isWorkerView ? 'Inventory count sessions and lines assigned to your work scope.' : 'Open a warehouse count, snapshot bin quantities, enter counted values by location, review differences, approve, and create adjustment stock movements.'}
        actions={canCreateInventoryCount ? <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setDialogOpen(true)}>New count</Button> : null}
      />
      <TableLayout
        title="Inventory count sessions"
        filters={
          <FilterPanel
            title="Filters"
            description="Filter sessions by warehouse."
            activeFilters={warehouseFilter ? [{ key: 'warehouse', label: `Warehouse: ${warehouseFilter.label}`, onDelete: () => { setWarehouseFilter(null); setPage(0); } }] : []}
          >
            <EntityLookupField
              label="Warehouse"
              entityType="warehouses"
              value={warehouseFilter}
              onChange={(value) => {
                setWarehouseFilter(value);
                setPage(0);
              }}
              accessMode="read"
              placeholder="All warehouses"
              dialogTitle="Filter inventory counts by warehouse"
              searchPlaceholder="Search warehouses..."
            />
          </FilterPanel>
        }
        table={
          <DataTable<InventoryCountSessionSummaryResponse>
            columns={columns}
            rows={sessionsQuery.data?.content ?? []}
            getRowId={(session) => session.id}
            loading={sessionsQuery.isLoading}
            error={sessionsQuery.isError}
            onRetry={() => sessionsQuery.refetch()}
            emptyTitle="No inventory count sessions"
            emptyDescription="No inventory count sessions match the selected filters."
            minWidth={920}
            sort={sort}
            onSortChange={handleSortChange}
            pagination={
              <ServerTablePagination
                page={sessionsQuery.data}
                disabled={sessionsQuery.isFetching}
                onPageChange={setPage}
                onSizeChange={handleSizeChange}
              />
            }
          />
        }
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New inventory count</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <EntityLookupField
              label="Warehouse"
              entityType="warehouses"
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
              required
              accessMode="mutate"
              placeholder="Choose a warehouse you can manage"
              dialogTitle="Choose warehouse for inventory count"
              searchPlaceholder="Search managed warehouses..."
              helperText="Only warehouses you are allowed to modify are available for new inventory counts."
            />
            {selectedWarehouse ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">Location snapshot scope</Typography>
                  <Typography variant="body2" color="text.secondary">
                    The backend creates one count line for every product/bin inventory row in {selectedWarehouse.label}. Use the details page filters to review by zone and bin after creation.
                  </Typography>
                  <Divider />
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={`${zoneCount} zones`} />
                    <Chip size="small" label={`${binCount} bins`} />
                  </Stack>
                </Stack>
              </Paper>
            ) : null}
            <TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!selectedWarehouse || createMutation.isPending} onClick={() => selectedWarehouse && createMutation.mutate({ warehouseId: selectedWarehouse.id, description })}>Create</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
