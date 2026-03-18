import apiClient from './client';

export const commoditiesAPI = {
  async list(params?: { search?: string; limit?: number; offset?: number }) {
    const { data } = await apiClient.get('/api/commodities/', { params });
    return data.results || data;
  },

  async get(id: string | number) {
    const { data } = await apiClient.get(`/api/commodities/${id}/`);
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
    const { data } = await apiClient.post('/api/commodities/', payload);
    return data;
  },

  async update(id: string | number, payload: any) {
    const { data } = await apiClient.put(`/api/commodities/${id}/`, payload);
    return data;
  },

  async delete(id: string | number) {
    await apiClient.delete(`/api/commodities/${id}/`);
  },

  async getPriceHistory(id: string | number, days: number = 30) {
    const { data } = await apiClient.get(`/api/commodities/${id}/price-history/`, {
      params: { days },
    });
    return data;
  },
};
