import { useMemo, useState } from 'react';
import { Chip, Stack, Typography } from '@mui/material';
import { getErrorMessage } from '../../../core/utils/getErrorMessage';
import { useStockMovements } from '../../stock-movements/hooks/useStockMovements';
import type { StockMovementResponse, StockMovementType } from '../../stock-movements/types/stockMovement.types';
import { SearchSelectPanel, useDebouncedValue } from '../../../shared/search-select';
import type { SearchSelectColumn, SearchSelectFilterOption } from '../../../shared/search-select';

export type StockMovementSearchSelectProps = {
  title?: string;
  value?: number | null;
  onSelect: (stockMovement: StockMovementResponse) => void;
};

const movementColumns: SearchSelectColumn<StockMovementResponse>[] = [
  {
    key: 'movement',
    label: 'Movement',
    render: (movement) => (
      <Stack spacing={0.25}>
        <Typography variant="body2" fontWeight={600}>
          #{movement.id} · {movement.productName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {movement.warehouseName} · {movement.referenceNumber ?? 'No reference number'}
        </Typography>
      </Stack>
    ),
  },
  { key: 'type', label: 'Type', render: (movement) => <Chip size="small" label={movement.movementType} />, width: 150 },
  { key: 'quantity', label: 'Qty', render: (movement) => movement.quantity, width: 100 },
  { key: 'created', label: 'Created', render: (movement) => movement.createdAt, width: 180 },
];

const movementTypeOptions: SearchSelectFilterOption<StockMovementType | 'ALL'>[] = [
  { value: 'ALL', label: 'All' },
  { value: 'INBOUND', label: 'Inbound' },
  { value: 'OUTBOUND', label: 'Outbound' },
  { value: 'TRANSFER_IN', label: 'Transfer in' },
  { value: 'TRANSFER_OUT', label: 'Transfer out' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'WRITE_OFF', label: 'Write-off' },
  { value: 'RETURN_IN', label: 'Return in' },
  { value: 'RETURN_OUT', label: 'Return out' },
];

export function StockMovementSearchSelect({
  title = 'Select stock movement',
  value,
  onSelect,
}: StockMovementSearchSelectProps) {
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType | 'ALL'>('ALL');
  const debouncedSearch = useDebouncedValue(search);

  const stockMovementsQuery = useStockMovements({
    search: debouncedSearch,
    movementType,
    warehouseId: 'ALL',
    productId: 'ALL',
    transportOrderId: 'ALL',
    fromDate: '',
    toDate: '',
    page: 0,
    size: 10,
    sort: 'createdAt,desc',
  });

  const rows = stockMovementsQuery.data?.content ?? [];
  const selectedLabel = useMemo(() => {
    const selected = rows.find((movement) => movement.id === value);
    return selected ? `#${selected.id} · ${selected.productName}` : null;
  }, [rows, value]);

  return (
    <SearchSelectPanel
      title={title}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by movement ID, reference, product or warehouse..."
      statusLabel="Movement type"
      statusValue={movementType}
      statusOptions={movementTypeOptions}
      onStatusChange={setMovementType}
      rows={rows}
      columns={movementColumns}
      getRowKey={(movement) => movement.id}
      selectedId={value}
      selectedLabel={selectedLabel}
      onSelect={onSelect}
      loading={stockMovementsQuery.isFetching}
      error={stockMovementsQuery.error ? getErrorMessage(stockMovementsQuery.error) : null}
      emptyMessage="No stock movements found."
    />
  );
}
