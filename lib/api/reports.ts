import apiClient from './client';

export const reportsAPI = {
  async getReport(type: string, dateRange: string) {
    // ✅ Removed /api/ prefix
    const { data } = await apiClient.get(`/reports/${type}/`, {
      params: { date_range: dateRange },
    });
    return data;
  },

  async getSalesTrend(dateRange: string) {
    const { data } = await apiClient.get('/reports/sales-trend/', { // ✅ Fixed
      params: { date_range: dateRange },
    });
    return data;
  },

  async getInventoryReport(dateRange?: string) {
    const { data } = await apiClient.get('/reports/inventory/', { // ✅ Fixed
      params: { date_range: dateRange },
    });
    return data;
  },

  async getTradingReport(dateRange?: string) {
    const { data } = await apiClient.get('/reports/trading/', { // ✅ Fixed
      params: { date_range: dateRange },
    });
    return data;
  },

  async getFinancialReport(dateRange?: string) {
    const { data } = await apiClient.get('/reports/financial/', { // ✅ Fixed
      params: { date_range: dateRange },
    });
    return data;
  },

  async exportReport(type: string, format: 'pdf' | 'csv' | 'excel') {
    const { data } = await apiClient.get(`/reports/${type}/export/`, { // ✅ Fixed
      params: { format },
      responseType: 'blob',
    });
    return data;
  },
};