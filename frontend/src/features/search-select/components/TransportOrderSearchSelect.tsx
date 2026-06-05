import { useMemo, useState } from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useTransportOrders } from '../../transport-orders/hooks/useTransportOrders';
import type { TransportOrderResponse, TransportOrderStatus } from '../../transport-orders/types/transportOrder.types';
import { SearchSelectPanel, useDebouncedValue } from '../../../shared/search-select';
import type { SearchSelectColumn, SearchSelectFilterOption } from '../../../shared/search-select';

export type TransportOrderSearchSelectProps = {
  title?: string;
  value?: number | null;
  onSelect: (transportOrder: TransportOrderResponse) => void;
};

const transportOrderColumns: SearchSelectColumn<TransportOrderResponse>[] = [
  {
    key: 'order',
    label: 'Transport order',
    render: (order) => (
      <Stack spacing={0.25}>
        <Typography variant="body2" fontWeight={600}>
          {order.orderNumber}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {order.description}
        </Typography>
      </Stack>
    ),
  },
  { key: 'status', label: 'Status', render: (order) => <Chip size="small" label={order.status} />, width: 130 },
  { key: 'priority', label: 'Priority', render: (order) => <Chip size="small" label={order.priority} />, width: 120 },
  { key: 'date', label: 'Order date', render: (order) => order.orderDate, width: 140 },
];

const statusOptions: SearchSelectFilterOption<'ALL' | TransportOrderStatus>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function TransportOrderSearchSelect({
  title = 'Select transport order',
  value,
  onSelect,
}: TransportOrderSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | TransportOrderStatus>('ALL');
  const debouncedSearch = useDebouncedValue(search);

  const transportOrdersQuery = useTransportOrders({
    search: debouncedSearch,
    status,
    size: 10,
    sort: 'orderDate,desc',
  });

  const rows = transportOrdersQuery.data?.content ?? [];
  const selectedLabel = useMemo(() => rows.find((order) => order.id === value)?.orderNumber ?? null, [rows, value]);

  return (
    <SearchSelectPanel
      title={title}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by order number, description or status..."
      statusValue={status}
      statusOptions={statusOptions}
      onStatusChange={setStatus}
      rows={rows}
      columns={transportOrderColumns}
      getRowKey={(order) => order.id}
      selectedId={value}
      selectedLabel={selectedLabel}
      onSelect={onSelect}
      loading={transportOrdersQuery.isFetching}
      error={transportOrdersQuery.error ? getErrorMessage(transportOrdersQuery.error) : null}
      emptyMessage="No transport orders found."
    />
  );
}
