type MovementFilters = {
  warehouseId?: number | string | null;
  productId?: number | string | null;
  transportOrderId?: number | string | null;
  binLocationId?: number | string | null;
  tab?: 'stock' | 'internal';
};

function appendQuery(path: string, params: Record<string, number | string | null | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '' || value === 'ALL') {
      return;
    }
    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export const warehouseLocationRoutes = {
  warehouses: () => '/warehouses',
  warehouseDetails: (warehouseId: number | string) => `/warehouses/${warehouseId}`,
  warehouseLocations: (warehouseId: number | string) => `/warehouses/${warehouseId}/zones`,
  warehouseLocationDetails: (warehouseId: number | string, zoneId: number | string) => `/warehouses/${warehouseId}/zones/${zoneId}`,
  binDetails: (warehouseId: number | string, zoneId: number | string, binId: number | string) => `/warehouses/${warehouseId}/zones/${zoneId}/bins/${binId}`,
  inventory: (warehouseId?: number | string | null) => appendQuery('/inventory', { warehouseId }),
  inventoryDetails: (warehouseId: number | string, productId: number | string) => `/inventory/${warehouseId}/${productId}`,
  stockMovements: (filters: MovementFilters = {}) => appendQuery('/stock-movements', {
    tab: filters.tab === 'internal' ? 'internal' : undefined,
    warehouseId: filters.warehouseId,
    productId: filters.productId,
    transportOrderId: filters.transportOrderId,
    binLocationId: filters.binLocationId,
  }),
  stockMovementDetails: (movementId: number | string) => `/stock-movements/${movementId}`,
  productDetails: (productId: number | string) => `/products/${productId}`,
  transportOrderDetails: (transportOrderId: number | string) => `/transport-orders/${transportOrderId}`,
};
