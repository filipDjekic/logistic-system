export type StockMovementType =
  | 'INBOUND'
  | 'OUTBOUND'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'WRITE_OFF'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE';

export type StockMovementStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REVERSED';

export type StockMovementReasonCode =
  | 'INITIAL_STOCK'
  | 'MANUAL_INBOUND'
  | 'PURCHASE_RECEIPT'
  | 'TRANSPORT_RECEIPT'
  | 'MANUAL_OUTBOUND'
  | 'TRANSPORT_DISPATCH'
  | 'INVENTORY_ADJUSTMENT'
  | 'CORRECTION'
  | 'DAMAGE_WRITE_OFF'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'STOCK_RESERVED'
  | 'RESERVATION_RELEASED';

export type StockAdjustmentDirection = 'INCREASE' | 'DECREASE';

export type StockMovementDiscrepancyReason =
  | 'SHORTAGE'
  | 'OVERAGE'
  | 'DAMAGE'
  | 'PICKING_ERROR'
  | 'RECEIVING_ERROR'
  | 'TRANSPORT_LOSS'
  | 'OTHER';

export type StockMovementResponse = {
  id: number;
  movementType: string;
  status?: StockMovementStatus | string | null;
  allowedNextStatuses?: Array<StockMovementStatus | string>;
  quantity: number;
  expectedQuantity?: number;
  actualQuantity?: number;
  discrepancyQuantity?: number;
  discrepancyReason?: StockMovementDiscrepancyReason | null;
  discrepancyNote?: string | null;
  unitCost?: number | null;
  totalCost?: number | null;
  currency?: string | null;
  batchLotNumber?: string | null;
  batchExpirationDate?: string | null;
  serialNumbers?: string | null;
  reasonCode?: string;
  reasonDescription?: string | null;
  referenceType?: string;
  referenceId?: number | null;
  referenceNumber?: string | null;
  referenceNote?: string | null;
  transferGroupId?: string | null;
  sourceType?: string | null;
  sourceId?: number | null;
  referenceCode?: string | null;
  parentMovementId?: number | null;
  rootMovementId?: number | null;
  reversalOfMovementId?: number | null;
  reversedByMovementId?: number | null;
  adjustmentDirection?: StockAdjustmentDirection | null;
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productName: string;
  transportOrderId?: number | null;
  sourceBinId?: number | null;
  sourceBinCode?: string | null;
  sourceBinZoneId?: number | null;
  destinationBinId?: number | null;
  destinationBinCode?: string | null;
  destinationBinZoneId?: number | null;
  quantityBefore: number;
  quantityAfter: number;
  reservedBefore?: number;
  reservedAfter?: number;
  availableBefore?: number;
  availableAfter?: number;
  createdAt: string;
};

export type StockMovementTraceResponse = {
  movementId: number;
  rootMovementId?: number | null;
  parentMovementId?: number | null;
  transferGroupId?: string | null;
  sourceType?: string | null;
  sourceId?: number | null;
  referenceCode?: string | null;
  movements: StockMovementResponse[];
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
  status?: StockMovementStatus | 'ALL';
  warehouseId: number | 'ALL';
  productId: number | 'ALL';
  transportOrderId: number | 'ALL';
  binLocationId?: number | 'ALL';
  fromDate: string;
  toDate: string;
  reasonCode?: StockMovementReasonCode | 'ALL';
};

export type StockInboundRequest = {
  quantity: number;
  expectedQuantity?: number;
  actualQuantity?: number;
  discrepancyReason?: StockMovementDiscrepancyReason;
  discrepancyNote?: string;
  unitCost?: number;
  totalCost?: number;
  currency?: string;
  batchLotNumber?: string;
  batchExpirationDate?: string;
  serialNumbers?: string[];
  reasonDescription?: string;
  referenceNumber?: string;
  referenceNote?: string;
  referenceId?: number;
  transportOrderId?: number;
  warehouseId: number;
  productId: number;
  binLocationId?: number;
};

export type StockOutboundRequest = StockInboundRequest;

export type StockTransferRequest = {
  quantity: number;
  expectedQuantity?: number;
  actualQuantity?: number;
  discrepancyReason?: StockMovementDiscrepancyReason;
  discrepancyNote?: string;
  unitCost?: number;
  totalCost?: number;
  currency?: string;
  batchLotNumber?: string;
  batchExpirationDate?: string;
  serialNumbers?: string[];
  reasonDescription?: string;
  referenceNumber?: string;
  referenceNote?: string;
  transportOrderId?: number;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  productId: number;
  sourceBinLocationId?: number;
  destinationBinLocationId?: number;
};

export type StockAdjustmentRequest = {
  quantity: number;
  expectedQuantity?: number;
  actualQuantity?: number;
  discrepancyReason?: StockMovementDiscrepancyReason;
  discrepancyNote?: string;
  unitCost?: number;
  totalCost?: number;
  currency?: string;
  batchLotNumber?: string;
  batchExpirationDate?: string;
  serialNumbers?: string[];
  direction: StockAdjustmentDirection;
  reasonDescription?: string;
  referenceNumber?: string;
  referenceNote?: string;
  referenceId?: number;
  warehouseId: number;
  productId: number;
  binLocationId?: number;
};

export type StockWriteOffRequest = {
  quantity: number;
  expectedQuantity?: number;
  actualQuantity?: number;
  discrepancyReason?: StockMovementDiscrepancyReason;
  discrepancyNote?: string;
  unitCost?: number;
  totalCost?: number;
  currency?: string;
  batchLotNumber?: string;
  batchExpirationDate?: string;
  serialNumbers?: string[];
  reasonDescription?: string;
  referenceNumber?: string;
  referenceNote?: string;
  referenceId?: number;
  warehouseId: number;
  productId: number;
  binLocationId?: number;
};

export type StockReturnRequest = StockWriteOffRequest;

export type StockOperationType = 'inbound' | 'outbound' | 'transfer' | 'internal' | 'adjustment' | 'write-off' | 'return';

export type StockOperationFormValues = {
  quantity: number;
  expectedQuantity?: number;
  actualQuantity?: number;
  discrepancyReason?: StockMovementDiscrepancyReason;
  discrepancyNote?: string;
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
