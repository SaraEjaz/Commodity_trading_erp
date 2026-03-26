import apiClient from './client';

export const inventoryAPI = {
  async list(params?: { search?: string; limit?: number; offset?: number; warehouse?: string }) {
    // ✅ Removed /api/ prefix (client baseURL already includes /api)
    const { data } = await apiClient.get('/inventory/', { params });
    return Array.isArray(data) ? data : (data.results || []);
  },

  async get(id: string | number) {
    const { data } = await apiClient.get(`/inventory/${id}/`); // ✅ Fixed
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
    const { data } = await apiClient.post('/inventory/', payload); // ✅ Fixed
    return data;
  },

  async update(id: string | number, payload: any) {
    const { data } = await apiClient.put(`/inventory/${id}/`, payload); // ✅ Fixed
    return data;
  },

  async delete(id: string | number) {
    await apiClient.delete(`/inventory/${id}/`); // ✅ Fixed
  },

  async adjustStock(id: string | number, quantity: number, reason: string) {
    const { data } = await apiClient.post(`/inventory/${id}/adjust-stock/`, { // ✅ Fixed
      quantity,
      reason,
    });
    return data;
  },

  async getLowStockItems() {
    const { data } = await apiClient.get('/inventory/low-stock/'); // ✅ Fixed
    return data;
  },
};