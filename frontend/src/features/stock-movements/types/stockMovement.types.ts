export type StockMovementType =
  | 'INBOUND'
  | 'OUTBOUND'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'WRITE_OFF'
  | 'RETURN_IN'
  | 'RETURN_OUT';

export type StockAdjustmentDirection = 'INCREASE' | 'DECREASE';

export type StockMovementResponse = {
  id: number;
  movementType: string;
  quantity: number;
  reasonCode?: string;
  reasonDescription?: string | null;
  referenceType?: string;
  referenceId?: number | null;
  referenceNumber?: string | null;
  referenceNote?: string | null;
  transferGroupId?: string | null;
  adjustmentDirection?: StockAdjustmentDirection | null;
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productName: string;
  transportOrderId?: number | null;
  quantityBefore: number;
  quantityAfter: number;
  reservedBefore?: number;
  reservedAfter?: number;
  availableBefore?: number;
  availableAfter?: number;
  createdAt: string;
};

export type StockMovementWarehouseOption = {
  id: number;
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'FULL' | 'UNDER_MAINTENANCE';
  employeeId?: number | null;
};

export type StockMovementProductOption = {
  id: number;
  name: string;
  description?: string | null;
  sku?: string;
  unit?: string;
  price?: number;
  fragile?: boolean;
  weight?: number | null;
};

export type StockMovementTransportOrderOption = {
  id: number;
  orderNumber: string;
  description?: string;
  orderDate?: string;
  departureTime?: string;
  plannedArrivalTime?: string;
  actualArrivalTime?: string | null;
  status?: 'CREATED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  totalWeight?: number | null;
  notes?: string | null;
  sourceWarehouseId?: number;
  destinationWarehouseId?: number;
  vehicleId?: number;
  assignedEmployeeId?: number;
  createdById?: number;
};

export type StockMovementFiltersState = {
  search: string;
  movementType: StockMovementType | 'ALL';
  warehouseId: number | 'ALL';
  productId: number | 'ALL';
  transportOrderId: number | 'ALL';
  fromDate: string;
  toDate: string;
};

export type StockInboundRequest = {
  quantity: number;
  reasonDescription?: string;
  referenceNumber?: string;
  referenceNote?: string;
  referenceId?: number;
  transportOrderId?: number;
  warehouseId: number;
  productId: number;
};

export type StockOutboundRequest = StockInboundRequest;

export type StockTransferRequest = {
  quantity: number;
  reasonDescription?: string;
  referenceNumber?: string;
  referenceNote?: string;
  transportOrderId?: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  productId: number;
};

export type StockAdjustmentRequest = {
  quantity: number;
  direction: StockAdjustmentDirection;
  reasonDescription?: string;
  referenceNumber?: string;
  referenceNote?: string;
  referenceId?: number;
  warehouseId: number;
  productId: number;
};

export type StockWriteOffRequest = {
  quantity: number;
  reasonDescription?: string;
  referenceNumber?: string;
  referenceNote?: string;
  referenceId?: number;
  warehouseId: number;
  productId: number;
};

export type StockReturnRequest = StockWriteOffRequest;

export type StockOperationType = 'inbound' | 'outbound' | 'transfer' | 'adjustment' | 'write-off' | 'return';

export type StockOperationFormValues = {
  quantity: number;
  warehouse: StockMovementWarehouseOption | null;
  destinationWarehouse: StockMovementWarehouseOption | null;
  product: StockMovementProductOption | null;
  transportOrder: StockMovementTransportOrderOption | null;
  adjustmentDirection: StockAdjustmentDirection;
  reasonDescription: string;
  referenceNumber: string;
  referenceId: string;
  referenceNote: string;
};
