import { apiClient } from '../../../core/api/client';
import type { PageResponse } from '../../../core/api/pagination';
import type { LookupEntityType, LookupOption, LookupParams } from '../types/lookup.types';

const LOOKUP_PATHS: Record<LookupEntityType, string> = {
  warehouses: '/api/warehouses/lookup',
  products: '/api/products/lookup',
  vehicles: '/api/vehicles/lookup',
  employees: '/api/employees/lookup',
  'transport-orders': '/api/transport-orders/lookup',
  'stock-movements': '/api/stock-movements/lookup',
  'bin-locations': '/api/bin-locations/lookup',
  companies: '/api/companies/lookup',
};

export const lookupApi = {
  getOptions(entityType: LookupEntityType, params: LookupParams = {}) {
    return apiClient
      .get<PageResponse<LookupOption>>(LOOKUP_PATHS[entityType], { params })
      .then((response) => response.data);
  },
};
