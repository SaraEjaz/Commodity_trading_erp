import apiClient from '@/lib/api/client';
import { CommissionDealFormData } from '@/lib/types/commission';

export const getCommissionDeals = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/commission/deals/${query}`);
  return response.data;
};

export const getCommissionDeal = async (id: number | string) => {
  const response = await apiClient.get(`/commission/deals/${id}/`);
  return response.data;
};

export const createCommissionDeal = async (payload: CommissionDealFormData) => {
  const response = await apiClient.post('/commission/deals/', payload);
  return response.data;
};

export const updateCommissionDeal = async (
  id: number | string,
  payload: Partial<CommissionDealFormData>
) => {
  const response = await apiClient.patch(`/commission/deals/${id}/`, payload);
  return response.data;
};

export const deleteCommissionDeal = async (id: number | string) => {
  const response = await apiClient.delete(`/commission/deals/${id}/`);
  return response.data;
};