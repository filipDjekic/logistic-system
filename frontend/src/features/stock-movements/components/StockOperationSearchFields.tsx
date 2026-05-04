import { useMemo, useState } from 'react';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../core/constants/queryKeys';
import { stockMovementsApi } from '../api/stockMovementsApi';
import type {
  StockMovementProductOption,
  StockMovementTransportOrderOption,
  StockMovementWarehouseOption,
} from '../types/stockMovement.types';

type WarehouseSearchProps = {
  label?: string;
  value: StockMovementWarehouseOption | null;
  error?: string;
  disabled?: boolean;
  excludeWarehouseId?: number | null;
  onChange: (value: StockMovementWarehouseOption | null) => void;
};

export function WarehouseSearch({
  label = 'Warehouse',
  value,
  error,
  disabled,
  excludeWarehouseId,
  onChange,
}: WarehouseSearchProps) {
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: queryKeys.stockMovements.operationWarehouseSearch(search),
    queryFn: () => stockMovementsApi.getWarehouses(search),
    staleTime: 30_000,
  });

  const options = useMemo(
    () => (query.data ?? []).filter((warehouse) => warehouse.id !== excludeWarehouseId),
    [excludeWarehouseId, query.data],
  );

  return (
    <Autocomplete
      value={value}
      options={options}
      loading={query.isFetching}
      disabled={disabled}
      onChange={(_, nextValue) => onChange(nextValue)}
      onInputChange={(_, nextInput) => setSearch(nextInput)}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={(option) => [option.name, option.city].filter(Boolean).join(' · ')}
      noOptionsText={search.trim() ? 'No warehouses found' : 'Type to search warehouses'}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={Boolean(error)}
          helperText={error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {query.isFetching ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

type ProductSearchProps = {
  value: StockMovementProductOption | null;
  error?: string;
  disabled?: boolean;
  onChange: (value: StockMovementProductOption | null) => void;
};

export function ProductSearch({ value, error, disabled, onChange }: ProductSearchProps) {
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: queryKeys.stockMovements.operationProductSearch(search),
    queryFn: () => stockMovementsApi.getProducts(search),
    staleTime: 30_000,
  });

  return (
    <Autocomplete
      value={value}
      options={query.data ?? []}
      loading={query.isFetching}
      disabled={disabled}
      onChange={(_, nextValue) => onChange(nextValue)}
      onInputChange={(_, nextInput) => setSearch(nextInput)}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={(option) => [option.name, option.sku].filter(Boolean).join(' · ')}
      noOptionsText={search.trim() ? 'No products found' : 'Type to search products'}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Product"
          error={Boolean(error)}
          helperText={error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {query.isFetching ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

type TransportOrderSearchProps = {
  value: StockMovementTransportOrderOption | null;
  error?: string;
  disabled?: boolean;
  onChange: (value: StockMovementTransportOrderOption | null) => void;
};

export function TransportOrderSearch({ value, error, disabled, onChange }: TransportOrderSearchProps) {
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: queryKeys.stockMovements.operationTransportOrderSearch(search),
    queryFn: () => stockMovementsApi.getTransportOrders(search),
    staleTime: 30_000,
  });

  return (
    <Autocomplete
      value={value}
      options={query.data ?? []}
      loading={query.isFetching}
      disabled={disabled}
      onChange={(_, nextValue) => onChange(nextValue)}
      onInputChange={(_, nextInput) => setSearch(nextInput)}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={(option) => [option.orderNumber, option.status].filter(Boolean).join(' · ')}
      noOptionsText={search.trim() ? 'No transport orders found' : 'Type to search transport orders'}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Transport order"
          error={Boolean(error)}
          helperText={error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {query.isFetching ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
