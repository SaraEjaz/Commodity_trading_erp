import apiClient from './client';

export const commoditiesAPI = {
  async list(params?: { search?: string; limit?: number; offset?: number }) {
    // ✅ Removed /api/ prefix
    const { data } = await apiClient.get('/commodities/', { params });
    return Array.isArray(data) ? data : (data.results || []);
  },

  async get(id: string | number) {
    const { data } = await apiClient.get(`/commodities/${id}/`); // ✅ Fixed
    return data;
  },

  async create(payload: {
    name: string;
    symbol: string;
    category: string;
    unit: string;
    current_price: number;
    description?: string;
  }) {
    const { data } = await apiClient.post('/commodities/', payload); // ✅ Fixed
    return data;
  },

  async update(id: string | number, payload: any) {
    const { data } = await apiClient.put(`/commodities/${id}/`, payload); // ✅ Fixed
    return data;
  },

  async delete(id: string | number) {
    await apiClient.delete(`/commodities/${id}/`); // ✅ Fixed
  },

  async getPriceHistory(id: string | number, days: number = 30) {
    const { data } = await apiClient.get(`/commodities/${id}/price-history/`, { // ✅ Fixed
      params: { days },
    });
    return data;
  },
};