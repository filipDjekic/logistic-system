export type InventoryCountSessionStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'COUNTING'
  | 'REVIEW'
  | 'APPROVED'
  | 'ADJUSTMENTS_CREATED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED';

export type InventoryCountLineResponse = {
  id: number;
  productId: number;
  productName: string;
  productSku?: string | null;
  binLocationId?: number | null;
  binLocationCode?: string | null;
  binLocationName?: string | null;
  warehouseZoneId?: number | null;
  warehouseZoneCode?: string | null;
  warehouseZoneName?: string | null;
  systemQuantity: number;
  countedQuantity?: number | null;
  differenceQuantity: number;
  note?: string | null;
  adjustmentMovementId?: number | null;
};

export type InventoryCountSessionSummaryResponse = {
  id: number;
  code: string;
  description?: string | null;
  status: InventoryCountSessionStatus;
  warehouseId: number;
  warehouseName: string;
  createdById?: number | null;
  reviewedById?: number | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lineCount: number;
  countedLineCount: number;
  discrepancyLineCount: number;
};

export type InventoryCountSessionResponse = InventoryCountSessionSummaryResponse & {
  lines?: InventoryCountLineResponse[];
};

export type InventoryCountLineStatusFilter = 'COUNTED' | 'UNCOUNTED' | 'DISCREPANCY' | 'MATCHED' | 'ADJUSTED';

export type InventoryCountSessionCreate = {
  warehouseId: number;
  description?: string;
};

export type InventoryCountLineUpdate = {
  binLocationId?: number | null;
  countedQuantity: number;
  note?: string;
};

export type AllowedStatusTransitionsResponse = {
  currentStatus: InventoryCountSessionStatus;
  allowedStatuses: InventoryCountSessionStatus[];
  version?: number | null;
};
