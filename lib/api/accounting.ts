import apiClient from '@/lib/api/client';

export interface PaymentReceived {
  id?: number;
  payment_date: string;
  party_code: string;
  party_name?: string;
  amount: number;
  payment_mode: 'cash' | 'cheque' | 'bank_transfer' | 'rtgs' | 'neft';
  reference_number: string;
  bank_name: string;
  remarks: string;
  status: 'pending' | 'cleared' | 'bounced';
}

export interface ThirdPartySettlement {
  id?: number;
  settlement_date: string;
  buyer_code: string;
  buyer_name?: string;
  seller_code: string;
  seller_name?: string;
  commodity: string;
  quantity: number;
  rate: number;
  buyer_commission: number;
  seller_commission: number;
  total_amount?: number;
  payment_status: 'pending' | 'paid' | 'partially_paid';
  remarks: string;
}

export interface CPR {
  id?: number;
  cpr_date: string;
  buyer_code: string;
  buyer_name?: string;
  seller_code: string;
  seller_name?: string;
  commodity: string;
  quantity: number;
  rate: number;
  buyer_commission: number;
  seller_commission: number;
  total_amount?: number;
  payment_status: 'pending' | 'paid' | 'partially_paid';
  remarks: string;
}

// Payment Received APIs
export const getPaymentReceived = async (params?: URLSearchParams) => {
  const url = params ? `/accounting/payments-received/?${params}` : '/accounting/payments-received/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createPaymentReceived = async (data: Omit<PaymentReceived, 'id'>) => {
  const response = await apiClient.post('/accounting/payments-received/', data);
  return response.data;
};

export const updatePaymentReceived = async (id: number, data: Partial<PaymentReceived>) => {
  const response = await apiClient.put(`/accounting/payments-received/${id}/`, data);
  return response.data;
};

export const deletePaymentReceived = async (id: number) => {
  const response = await apiClient.delete(`/accounting/payments-received/${id}/`);
  return response.data;
};

// Third Party Settlements APIs
export const getThirdPartySettlements = async (params?: URLSearchParams) => {
  const url = params ? `/accounting/settlements/?${params}` : '/accounting/settlements/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createThirdPartySettlement = async (data: Omit<ThirdPartySettlement, 'id'>) => {
  const response = await apiClient.post('/accounting/settlements/', data);
  return response.data;
};

export const updateThirdPartySettlement = async (id: number, data: Partial<ThirdPartySettlement>) => {
  const response = await apiClient.put(`/accounting/settlements/${id}/`, data);
  return response.data;
};

export const deleteThirdPartySettlement = async (id: number) => {
  const response = await apiClient.delete(`/accounting/settlements/${id}/`);
  return response.data;
};

// CPR (Commission Processing Report) APIs
export const getCPR = async (params?: URLSearchParams) => {
  const url = params ? `/accounting/cpr-entries/?${params}` : '/accounting/cpr-entries/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createCPR = async (data: Omit<CPR, 'id'>) => {
  const response = await apiClient.post('/accounting/cpr-entries/', data);
  return response.data;
};

export const updateCPR = async (id: number, data: Partial<CPR>) => {
  const response = await apiClient.put(`/accounting/cpr-entries/${id}/`, data);
  return response.data;
};

export const deleteCPR = async (id: number) => {
  const response = await apiClient.delete(`/accounting/cpr-entries/${id}/`);
  return response.data;
};