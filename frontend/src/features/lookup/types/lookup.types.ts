export type LookupEntityType =
  | 'warehouses'
  | 'products'
  | 'vehicles'
  | 'employees'
  | 'transport-orders'
  | 'stock-movements'
  | 'companies';

export type LookupOption = {
  id: number;
  label: string;
  subtitle?: string | null;
  status?: string | null;
  disabled?: boolean;
};

export type LookupParams = {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  activeOnly?: boolean;
  warehouseId?: number | string | null;
  zoneId?: number | string | null;
  accessMode?: 'read' | 'mutate' | 'mutation' | 'select' | 'reference';
  mode?: 'REFERENCE' | 'AVAILABLE_STOCK' | 'COMPANY' | 'MANAGED_WAREHOUSE';
  position?: string;
  status?: string;
  availableOnly?: boolean;
  availableFrom?: string;
  availableTo?: string;
  sourceWarehouseId?: number | string | null;
  destinationWarehouseId?: number | string | null;
  excludeStatuses?: string;
};
