export type WarehouseZoneType = 'RECEIVING' | 'STORAGE' | 'PICKING' | 'PACKING' | 'DISPATCH' | 'RETURNS' | 'QUARANTINE' | 'OTHER';
export type InternalWarehouseMovementStatus = 'COMPLETED' | 'CANCELLED';

export type WarehouseZoneResponse = {
  id: number; warehouseId: number; warehouseName: string; companyId: number; code: string; name: string; type: WarehouseZoneType; capacity: number | null; active: boolean; description: string | null; createdAt: string; updatedAt: string | null;
};
export type BinLocationResponse = {
  id: number; warehouseId: number; warehouseName: string; zoneId: number; zoneCode: string; zoneName: string; zoneType: WarehouseZoneType; companyId: number; code: string; name: string; capacity: number | null; active: boolean; description: string | null; createdAt: string; updatedAt: string | null;
};
export type BinInventoryResponse = {
  binLocationId: number; binLocationCode: string; binLocationName: string; warehouseId: number; warehouseName: string; zoneId: number; zoneCode: string; productId: number; productName: string; sku: string; quantity: number; lastUpdated: string | null;
};
export type InternalWarehouseMovementResponse = {
  id: number; warehouseId: number; warehouseName: string; productId: number; productName: string; sku: string; sourceBinId: number; sourceBinCode: string; destinationBinId: number; destinationBinCode: string; quantity: number; status: InternalWarehouseMovementStatus; note: string | null; createdById: number | null; createdByEmail: string | null; createdAt: string;
};
export type PageResponse<T> = { content: T[]; totalElements: number; totalPages: number; size: number; number: number; numberOfElements: number; first: boolean; last: boolean; empty: boolean };
