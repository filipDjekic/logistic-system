export type EntityRouteInput = {
  entityType?: string | null;
  entityName?: string | null;
  sourceType?: string | null;
  entityId?: number | string | null;
  sourceId?: number | string | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toUpperCase().replace(/-/g, '_') ?? '';
}

function normalizeId(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

export function getEntityDetailsPath(input: EntityRouteInput) {
  const type = normalize(input.entityType ?? input.entityName ?? input.sourceType);
  const id = normalizeId(input.entityId ?? input.sourceId);

  if (!id) {
    return null;
  }

  switch (type) {
    case 'COMPANY':
      return `/companies/${id}`;
    case 'EMPLOYEE':
      return `/employees/${id}`;
    case 'USER':
      return `/users/${id}`;
    case 'VEHICLE':
      return `/vehicles/${id}`;
    case 'WAREHOUSE':
      return `/warehouses/${id}`;
    case 'PRODUCT':
      return `/products/${id}`;
    case 'TASK':
      return `/tasks/${id}`;
    case 'TRANSPORT_ORDER':
      return `/transport-orders/${id}`;
    case 'STOCK_MOVEMENT':
      return `/stock-movements/${id}`;
    case 'SHIFT':
      return `/shifts?search=${id}`;
    case 'VEHICLE_MAINTENANCE':
      return `/vehicle-maintenance?search=${id}`;
    case 'WAREHOUSE_INVENTORY':
      return `/inventory?warehouseId=${id}`;
    default:
      return null;
  }
}
