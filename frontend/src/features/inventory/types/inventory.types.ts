export type WarehouseStatus = 'ACTIVE' | 'INACTIVE' | 'FULL' | 'UNDER_MAINTENANCE';

export type WarehouseInventoryResponse = {
  warehouseId: number;
  productId: number;
  quantity: number;
  reservedQuantity: number;
  minStockLevel: number | null;
};

export type InventoryWarehouseOption = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  status: WarehouseStatus;
  employeeId: number | null;
};

export type ProductUnit =
  | 'PIECE'
  | 'KILOGRAM'
  | 'LITER'
  | 'METER'
  | 'BOX'
  | 'PALLET';

export type InventoryProductOption = {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  unit: ProductUnit | string;
  price: number;
  fragile: boolean;
  weight: number;
};

export type DerivedInventoryStatus = 'LOW_STOCK' | 'SUFFICIENT';

export type InventoryListRow = WarehouseInventoryResponse & {
  warehouseName: string;
  warehouseCity: string;
  warehouseStatus: WarehouseStatus;
  productName: string;
  productSku: string;
  productUnit: string;
  availableQuantity: number;
  derivedStatus: DerivedInventoryStatus;
};

export type InventoryFiltersState = {
  search: string;
  warehouseId: number | 'ALL';
  productId: number | 'ALL';
  status: DerivedInventoryStatus | 'ALL';
};

export type InventoryRecordDetails = {
  record: InventoryListRow;
  warehouse: InventoryWarehouseOption | null;
  product: InventoryProductOption | null;
};