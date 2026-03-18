import apiClient from './client';

export const inventoryAPI = {
  async list(params?: { search?: string; limit?: number; offset?: number; warehouse?: string }) {
    const { data } = await apiClient.get('/api/inventory/', { params });
    return data.results || data;
  },

  async get(id: string | number) {
    const { data } = await apiClient.get(`/api/inventory/${id}/`);
    return data;
  },

  async create(payload: {
    commodity_id: number;
    warehouse: string;
    quantity: number;
    minimum_level: number;
    maximum_level: number;
    unit_price: number;
    location: string;
  }) {
    const { data } = await apiClient.post('/api/inventory/', payload);
    return data;
  },

  async update(id: string | number, payload: any) {
    const { data } = await apiClient.put(`/api/inventory/${id}/`, payload);
    return data;
  },

  async delete(id: string | number) {
    await apiClient.delete(`/api/inventory/${id}/`);
  },

  async adjustStock(id: string | number, quantity: number, reason: string) {
    const { data } = await apiClient.post(`/api/inventory/${id}/adjust-stock/`, {
      quantity,
      reason,
    });
    return data;
  },

  async getLowStockItems() {
    const { data } = await apiClient.get('/api/inventory/low-stock/');
    return data;
  },
};
