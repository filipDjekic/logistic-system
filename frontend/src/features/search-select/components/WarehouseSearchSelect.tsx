import { useMemo, useState } from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useWarehouses } from '../../warehouses/hooks/useWarehouses';
import type { WarehouseResponse, WarehouseStatus } from '../../warehouses/types/warehouse.types';
import { SearchSelectPanel, useDebouncedValue } from '../../../shared/search-select';
import type { SearchSelectColumn, SearchSelectFilterOption } from '../../../shared/search-select';

export type WarehouseSearchSelectProps = {
  title?: string;
  value?: number | null;
  onSelect: (warehouse: WarehouseResponse) => void;
  active?: boolean;
  disabledWarehouseIds?: number[];
};

const warehouseColumns: SearchSelectColumn<WarehouseResponse>[] = [
  {
    key: 'warehouse',
    label: 'Warehouse',
    render: (warehouse) => (
      <Stack spacing={0.25}>
        <Typography variant="body2" fontWeight={600}>
          {warehouse.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {warehouse.address}, {warehouse.city}
        </Typography>
      </Stack>
    ),
  },
  { key: 'capacity', label: 'Capacity', render: (warehouse) => warehouse.capacity, width: 120 },
  { key: 'manager', label: 'Manager', render: (warehouse) => warehouse.managerName ?? '-' },
  { key: 'status', label: 'Status', render: (warehouse) => <Chip size="small" label={warehouse.status} />, width: 170 },
];

const statusOptions: SearchSelectFilterOption<'ALL' | WarehouseStatus>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'FULL', label: 'Full' },
  { value: 'UNDER_MAINTENANCE', label: 'Under maintenance' },
];

export function WarehouseSearchSelect({
  title = 'Select warehouse',
  value,
  onSelect,
  active = true,
  disabledWarehouseIds = [],
}: WarehouseSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | WarehouseStatus>('ALL');
  const debouncedSearch = useDebouncedValue(search);

  const warehousesQuery = useWarehouses({
    search: debouncedSearch,
    status: status === 'ALL' ? undefined : status,
    active,
    size: 10,
    sort: 'name,asc',
  });

  const rows = warehousesQuery.data?.content ?? [];
  const selectedLabel = useMemo(() => rows.find((warehouse) => warehouse.id === value)?.name ?? null, [rows, value]);

  return (
    <SearchSelectPanel
      title={title}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name, city, address or manager..."
      statusValue={status}
      statusOptions={statusOptions}
      onStatusChange={setStatus}
      rows={rows}
      columns={warehouseColumns}
      getRowKey={(warehouse) => warehouse.id}
      selectedId={value}
      selectedLabel={selectedLabel}
      onSelect={onSelect}
      getSelectDisabled={(warehouse) => disabledWarehouseIds.includes(warehouse.id)}
      loading={warehousesQuery.isFetching}
      error={warehousesQuery.error ? getErrorMessage(warehousesQuery.error) : null}
      emptyMessage="No warehouses found."
    />
  );
}
