export type WarehouseStatus = 'ACTIVE' | 'INACTIVE' | 'FULL' | 'UNDER_MAINTENANCE';

export type WarehouseInventoryResponse = {
  warehouseId: number;
  warehouseName: string;
  warehouseCompanyId: number | null;

  productId: number;
  productName: string;
  productCompanyId: number | null;

  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStockLevel: number;
};

export type WarehouseInventoryCreateRequest = {
  warehouseId: number;
  productId: number;
  quantity: number;
  minStockLevel: number;
};

export type WarehouseInventoryUpdateRequest = {
  warehouseId?: number;
  productId?: number;
  quantity: number;
  minStockLevel: number;
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

export type ProductUnit = 'PIECE' | 'KG' | 'LITER' | 'BOX' | 'PALLET';

export type InventoryProductOption = {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  unit: ProductUnit;
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
  productUnit: ProductUnit;
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

export type InventoryFormValues = {
  warehouseId: number | '';
  productId: number | '';
  quantity: number | '';
  minStockLevel: number | '';
};