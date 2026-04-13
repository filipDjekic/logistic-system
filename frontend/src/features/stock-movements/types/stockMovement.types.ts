export type StockMovementType =
  | 'INBOUND'
  | 'OUTBOUND'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT';

export type StockMovementReasonCode =
  | 'INITIAL_STOCK'
  | 'PURCHASE_RECEIPT'
  | 'MANUAL_INBOUND'
  | 'MANUAL_OUTBOUND'
  | 'TRANSPORT_DISPATCH'
  | 'TRANSPORT_RECEIPT'
  | 'INVENTORY_ADJUSTMENT'
  | 'DAMAGE_WRITE_OFF'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'CORRECTION';

export type StockMovementReferenceType =
  | 'MANUAL'
  | 'TRANSPORT_ORDER'
  | 'INVENTORY_COUNT'
  | 'PURCHASE_DOCUMENT'
  | 'RETURN_DOCUMENT'
  | 'SYSTEM';

export type StockMovementResponse = {
  id: number;
  movementType: string;
  quantity: number;

  warehouseId: number;
  warehouseName: string;

  productId: number;
  productName: string;

  quantityBefore: number;
  quantityAfter: number;

  createdAt: string;
};

export type StockMovementCreateRequest = {
  movementType: StockMovementType;
  quantity: number;
  reasonCode: StockMovementReasonCode;
  reasonDescription?: string;
  referenceType: StockMovementReferenceType;
  referenceId?: number | null;
  referenceNumber?: string;
  referenceNote?: string;
  transportOrderId?: number | null;
  warehouseId: number;
  productId: number;
};

export type StockMovementWarehouseOption = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FULL' | 'UNDER_MAINTENANCE';
  employeeId: number | null;
};

export type StockMovementProductOption = {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  unit: string;
  price: number;
  fragile: boolean;
  weight: number | null;
};

export type StockMovementTransportOrderOption = {
  id: number;
  orderNumber: string;
  description: string;
  orderDate: string;
  departureTime: string;
  plannedArrivalTime: string;
  actualArrivalTime: string | null;
  status: 'CREATED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  totalWeight: number | null;
  notes: string | null;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  vehicleId: number;
  assignedEmployeeId: number;
  createdById: number;
};

export type StockMovementFiltersState = {
  search: string;
  movementType: StockMovementType | 'ALL';
  warehouseId: number | 'ALL';
  productId: number | 'ALL';
};

export type StockMovementFormValues = {
  movementType: StockMovementType;
  quantity: number;
  reasonCode: StockMovementReasonCode;
  reasonDescription: string;
  referenceType: StockMovementReferenceType;
  referenceId: number | null;
  referenceNumber: string;
  referenceNote: string;
  transportOrderId: number | null;
  warehouseId: number;
  productId: number;
};