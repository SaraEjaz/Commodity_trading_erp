import apiClient from '@/lib/api/client';
import { CommissionDealFormData } from '@/lib/types/commission';

const toNumber = (value: unknown, fallback = 0): number => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeDeal = (deal: any) => ({
  ...deal,
  total_quantity_mt: toNumber(deal.total_quantity_mt),
  quantity_lifted_mt: toNumber(deal.quantity_lifted_mt),
  quantity_remaining_mt: toNumber(deal.quantity_remaining_mt),
  total_buyer_commission: toNumber(deal.total_buyer_commission),
  total_seller_commission: toNumber(deal.total_seller_commission),
  commission_received: toNumber(deal.commission_received),
});

export const getCommissionDeals = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/commission/deals/${query}`);
  const data = response.data;

  if (Array.isArray(data)) {
    return data.map(normalizeDeal);
  }

  if (Array.isArray(data?.results)) {
    return {
      ...data,
      results: data.results.map(normalizeDeal),
    };
  }

  return data ? normalizeDeal(data) : data;
};

export const getCommissionDeal = async (id: number | string) => {
  const response = await apiClient.get(`/commission/deals/${id}/`);
  const data = response.data;
  return data ? normalizeDeal(data) : data;
};

export const createCommissionDeal = async (payload: CommissionDealFormData) => {
  const response = await apiClient.post('/commission/deals/', payload);
  const data = response.data;
  return data ? normalizeDeal(data) : data;
};

export const updateCommissionDeal = async (
  id: number | string,
  payload: Partial<CommissionDealFormData>
) => {
  const response = await apiClient.patch(`/commission/deals/${id}/`, payload);
  const data = response.data;
  return data ? normalizeDeal(data) : data;
};

export const deleteCommissionDeal = async (id: number | string) => {
  const response = await apiClient.delete(`/commission/deals/${id}/`);
  return response.data;
};

// Dispatch/Lifting APIs
export const getCommissionDispatches = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/commission/liftings/${query}`);
  return response.data;
};

export const getCommissionDispatch = async (id: number | string) => {
  const response = await apiClient.get(`/commission/liftings/${id}/`);
  return response.data;
};

export const createCommissionDispatch = async (payload: any) => {
  const response = await apiClient.post('/commission/liftings/', payload);
  return response.data;
};

export const updateCommissionDispatch = async (
  id: number | string,
  payload: Partial<any>
) => {
  const response = await apiClient.patch(`/commission/liftings/${id}/`, payload);
  return response.data;
};

export const deleteCommissionDispatch = async (id: number | string) => {
  const response = await apiClient.delete(`/commission/liftings/${id}/`);
  return response.data;
};

// Dashboard API
export const getCommissionDashboardSummary = async () => {
  const response = await apiClient.get('/commission/dashboard/summary/');
  return response.data;
};

// Extended Commission APIs
export const getDispatches = async (params?: URLSearchParams) => {
  return getCommissionDispatches(params);
};

export const generateInvoiceFromDispatch = async (id: number | string, payload: any) => {
  const response = await apiClient.post(`/commission/liftings/${id}/generate_invoice/`, payload);
  return response.data;
};

export const getCommissionRegister = async (params?: URLSearchParams) => {
  const dispatches = await getCommissionDispatches(params);
  const items = dispatches.results || dispatches;

  return items.map((dispatch: any) => ({
    ...dispatch,
    dispatch_id: dispatch.lifting_id,
    buyer_code: dispatch.principal_buyer_code || dispatch.principal_buyer,
    buyer_name: dispatch.principal_buyer_name,
    seller_code:
      dispatch.invoice_party_code || dispatch.receiver_party_code || dispatch.payment_party,
    seller_name: dispatch.receiver_name || dispatch.invoice_party_name || '',
    buyer_commission_status: dispatch.payment_status === 'paid' ? 'received' : 'pending',
    seller_commission_status: dispatch.payment_status === 'paid' ? 'received' : 'pending',
    remarks: dispatch.notes || '',
  }));
};

export const getCommissionCollections = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/accounting/payments-received/${query}`);
  return response.data.results || response.data;
};

// Report APIs
export const getDealBalanceReport = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/commission/reports/deal-balance/${query}`);
  return response.data;
};

export const getBuyerCommissionStatement = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/commission/reports/buyer-commission/${query}`);
  return response.data;
};

export const getSellerCommissionStatement = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/commission/reports/seller-commission/${query}`);
  return response.data;
};

export const getCommissionSummaryReport = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/commission/reports/commission-summary/${query}`);
  return response.data;
};

export const getDailyDispatchReport = async (params?: URLSearchParams) => {
  const query = params ? `?${params.toString()}` : '';
  const response = await apiClient.get(`/commission/reports/daily-dispatch/${query}`);
  return response.data;
};

// Action wrappers
export const closeCommissionDeal = async (id: number | string) => {
  const response = await apiClient.post(`/commission/deals/${id}/close/`);
  return response.data;
};

export const cancelCommissionDeal = async (id: number | string) => {
  const response = await apiClient.post(`/commission/deals/${id}/cancel/`);
  return response.data;
};

export const getDealSheet = async (id: number | string) => {
  const response = await apiClient.get(`/commission/deals/${id}/deal_sheet/`);
  const data = response.data;
  return data ? normalizeDeal(data) : data;
};

export const getRecentDispatches = async (limit = 5) => {
  const params = new URLSearchParams();
  params.append('ordering', '-lifting_date');
  params.append('page_size', String(limit));
  const dispatches = await getCommissionDispatches(params);
  return dispatches.results || dispatches;
};

export const getOpenDeals = async () => {
  const response = await apiClient.get('/commission/deals/open_deals/');
  const data = response.data;

  if (Array.isArray(data)) {
    return data.map(normalizeDeal);
  }

  return data;
};

export const getPendingLiftings = async () => {
  const response = await apiClient.get('/commission/liftings/pending_liftings/');
  return response.data;
};