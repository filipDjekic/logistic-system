import { useMemo, useState } from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useVehicles } from '../../vehicles/hooks/useVehicles';
import type { VehicleResponse, VehicleStatus } from '../../vehicles/types/vehicle.types';
import { SearchSelectPanel, useDebouncedValue } from '../../../shared/search-select';
import type { SearchSelectColumn, SearchSelectFilterOption } from '../../../shared/search-select';

export type VehicleSearchSelectProps = {
  title?: string;
  value?: number | null;
  onSelect: (vehicle: VehicleResponse) => void;
  availableOnly?: boolean;
  disabledVehicleIds?: number[];
};

const vehicleColumns: SearchSelectColumn<VehicleResponse>[] = [
  {
    key: 'vehicle',
    label: 'Vehicle',
    render: (vehicle) => (
      <Stack spacing={0.25}>
        <Typography variant="body2" fontWeight={600}>
          {vehicle.registrationNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {vehicle.brand} {vehicle.model} · {vehicle.type}
        </Typography>
      </Stack>
    ),
  },
  { key: 'capacity', label: 'Capacity', render: (vehicle) => vehicle.capacity, width: 120 },
  { key: 'fuel', label: 'Fuel', render: (vehicle) => vehicle.fuelType, width: 120 },
  { key: 'status', label: 'Status', render: (vehicle) => <Chip size="small" label={vehicle.status} />, width: 170 },
];

const statusOptions: SearchSelectFilterOption<'ALL' | VehicleStatus>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'IN_USE', label: 'In use' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OUT_OF_SERVICE', label: 'Out of service' },
];

export function VehicleSearchSelect({
  title = 'Select vehicle',
  value,
  onSelect,
  availableOnly = false,
  disabledVehicleIds = [],
}: VehicleSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | VehicleStatus>(availableOnly ? 'AVAILABLE' : 'ALL');
  const debouncedSearch = useDebouncedValue(search).trim();

  const vehiclesQuery = useVehicles({
    search: debouncedSearch || undefined,
    status: availableOnly ? 'AVAILABLE' : status === 'ALL' ? undefined : status,
    available: availableOnly ? true : undefined,
    size: 10,
    sort: 'registrationNumber,asc',
  });

  const rows = vehiclesQuery.data?.content ?? [];
  const selectedLabel = useMemo(() => rows.find((vehicle) => vehicle.id === value)?.registrationNumber ?? null, [rows, value]);

  return (
    <SearchSelectPanel
      title={title}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by registration, brand, model or type..."
      statusValue={availableOnly ? undefined : status}
      statusOptions={availableOnly ? undefined : statusOptions}
      onStatusChange={availableOnly ? undefined : setStatus}
      rows={rows}
      columns={vehicleColumns}
      getRowKey={(vehicle) => vehicle.id}
      selectedId={value}
      selectedLabel={selectedLabel}
      onSelect={onSelect}
      getSelectDisabled={(vehicle) => disabledVehicleIds.includes(vehicle.id)}
      loading={vehiclesQuery.isFetching}
      error={vehiclesQuery.error ? getErrorMessage(vehiclesQuery.error) : null}
      emptyMessage="No vehicles found."
    />
  );
}
