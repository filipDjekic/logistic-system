export type InventoryCountSessionStatus = 'OPEN' | 'COUNTING' | 'REVIEW' | 'ADJUSTMENTS_CREATED' | 'CANCELLED';

export type InventoryCountLineResponse = {
  id: number;
  productId: number;
  productName: string;
  productSku?: string | null;
  systemQuantity: number;
  countedQuantity?: number | null;
  differenceQuantity: number;
  note?: string | null;
  adjustmentMovementId?: number | null;
};

export type InventoryCountSessionResponse = {
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
  lines: InventoryCountLineResponse[];
};

export type InventoryCountSessionCreate = {
  warehouseId: number;
  description?: string;
};

export type InventoryCountLineUpdate = {
  countedQuantity: number;
  note?: string;
};
