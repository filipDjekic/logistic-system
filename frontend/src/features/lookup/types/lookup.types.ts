export type LookupEntityType =
  | 'warehouses'
  | 'products'
  | 'vehicles'
  | 'employees'
  | 'transport-orders'
  | 'stock-movements'
  | 'bin-locations'
  | 'companies';

export type LookupOption = {
  id: number;
  label: string;
  subtitle?: string | null;
  status?: string | null;
};

export type LookupParams = {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  activeOnly?: boolean;
  warehouseId?: number | string | null;
  accessMode?: 'read' | 'mutate';
  position?: string;
  active?: boolean;
  availableFrom?: string;
  availableTo?: string;
};
