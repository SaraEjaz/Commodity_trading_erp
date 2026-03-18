import apiClient from './client';

export const reportsAPI = {
  async getReport(type: string, dateRange: string) {
    const { data } = await apiClient.get(`/api/reports/${type}/`, {
      params: { date_range: dateRange },
    });
    return data;
  },

  async getSalesTrend(dateRange: string) {
    const { data } = await apiClient.get('/api/reports/sales-trend/', {
      params: { date_range: dateRange },
    });
    return data;
  },

  async getInventoryReport(dateRange?: string) {
    const { data } = await apiClient.get('/api/reports/inventory/', {
      params: { date_range: dateRange },
    });
    return data;
  },

  async getTradingReport(dateRange?: string) {
    const { data } = await apiClient.get('/api/reports/trading/', {
      params: { date_range: dateRange },
    });
    return data;
  },

  async getFinancialReport(dateRange?: string) {
    const { data } = await apiClient.get('/api/reports/financial/', {
      params: { date_range: dateRange },
    });
    return data;
  },

  async exportReport(type: string, format: 'pdf' | 'csv' | 'excel') {
    const { data } = await apiClient.get(`/api/reports/${type}/export/`, {
      params: { format },
      responseType: 'blob',
    });
    return data;
  },
};
