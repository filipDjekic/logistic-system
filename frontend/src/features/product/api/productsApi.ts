import { apiClient } from '../../../core/api/client';
import type {
  ProductCreateRequest,
  ProductResponse,
  ProductUpdateRequest,
} from '../types/product.types';

export const productsApi = {
  getAll: async () => {
    const res = await apiClient.get<ProductResponse[]>('/api/products');
    return res.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<ProductResponse>(`/api/products/${id}`);
    return res.data;
  },

  create: async (data: ProductCreateRequest) => {
    const res = await apiClient.post<ProductResponse>('/api/products', data);
    return res.data;
  },

  update: async (id: number, data: ProductUpdateRequest) => {
    const res = await apiClient.put<ProductResponse>(`/api/products/${id}`, data);
    return res.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/api/products/${id}`);
  },
};