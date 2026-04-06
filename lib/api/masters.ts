import apiClient from '@/lib/api/client';

export interface Party {
  id?: number;
  code: string;
  name: string;
  address: string;
  gst_number: string;
  contact_person: string;
  phone: string;
  email: string;
  party_type: 'buyer' | 'seller' | 'both';
  is_active: boolean;
}

export interface Commodity {
  id?: number;
  code: string;
  name: string;
  description: string;
  unit: string;
  is_active: boolean;
}

export interface BankAccount {
  id?: number;
  account_number: string;
  bank_name: string;
  branch_name: string;
  ifsc_code: string;
  account_holder_name: string;
  is_active: boolean;
}

export interface CommissionRule {
  id?: number;
  commodity: string;
  buyer_commission_rate: number;
  seller_commission_rate: number;
  minimum_quantity: number;
  maximum_quantity: number;
  effective_from: string;
  effective_to: string;
  is_active: boolean;
}

// Party APIs
export const getParties = async (params?: URLSearchParams) => {
  const url = params ? `/masters/parties/?${params}` : '/masters/parties/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createParty = async (data: Omit<Party, 'id'>) => {
  const response = await apiClient.post('/masters/parties/', data);
  return response.data;
};

export const updateParty = async (id: number, data: Partial<Party>) => {
  const response = await apiClient.put(`/masters/parties/${id}/`, data);
  return response.data;
};

export const deleteParty = async (id: number) => {
  const response = await apiClient.delete(`/masters/parties/${id}/`);
  return response.data;
};

// Commodity APIs
export const getCommodities = async (params?: URLSearchParams) => {
  const url = params ? `/masters/commodities/?${params}` : '/masters/commodities/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createCommodity = async (data: Omit<Commodity, 'id'>) => {
  const response = await apiClient.post('/masters/commodities/', data);
  return response.data;
};

export const updateCommodity = async (id: number, data: Partial<Commodity>) => {
  const response = await apiClient.put(`/masters/commodities/${id}/`, data);
  return response.data;
};

export const deleteCommodity = async (id: number) => {
  const response = await apiClient.delete(`/masters/commodities/${id}/`);
  return response.data;
};

// Bank Account APIs
export const getBankAccounts = async (params?: URLSearchParams) => {
  const url = params ? `/masters/bank-accounts/?${params}` : '/masters/bank-accounts/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createBankAccount = async (data: Omit<BankAccount, 'id'>) => {
  const response = await apiClient.post('/masters/bank-accounts/', data);
  return response.data;
};

export const updateBankAccount = async (id: number, data: Partial<BankAccount>) => {
  const response = await apiClient.put(`/masters/bank-accounts/${id}/`, data);
  return response.data;
};

export const deleteBankAccount = async (id: number) => {
  const response = await apiClient.delete(`/masters/bank-accounts/${id}/`);
  return response.data;
};

// Commission Rule APIs
export const getCommissionRules = async (params?: URLSearchParams) => {
  const url = params ? `/masters/commission-rules/?${params}` : '/masters/commission-rules/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createCommissionRule = async (data: Omit<CommissionRule, 'id'>) => {
  const response = await apiClient.post('/masters/commission-rules/', data);
  return response.data;
};

export const updateCommissionRule = async (id: number, data: Partial<CommissionRule>) => {
  const response = await apiClient.put(`/masters/commission-rules/${id}/`, data);
  return response.data;
};

export const deleteCommissionRule = async (id: number) => {
  const response = await apiClient.delete(`/masters/commission-rules/${id}/`);
  return response.data;
};

// Unit of Measure (UOF) APIs
export const getUofs = async (params?: URLSearchParams) => {
  const url = params ? `/masters/uofs/?${params}` : '/masters/uofs/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createUof = async (data: { code: string; name: string }) => {
  const response = await apiClient.post('/masters/uofs/', data);
  return response.data;
};

export const updateUof = async (id: number, data: Partial<{ code: string; name: string }>) => {
  const response = await apiClient.put(`/masters/uofs/${id}/`, data);
  return response.data;
};

export const deleteUof = async (id: number) => {
  const response = await apiClient.delete(`/masters/uofs/${id}/`);
  return response.data;
};

// Warehouse APIs
export const getWarehouses = async (params?: URLSearchParams) => {
  const url = params ? `/masters/warehouses/?${params}` : '/masters/warehouses/';
  const response = await apiClient.get(url);
  return response.data;
};

export const createWarehouse = async (data: any) => {
  const response = await apiClient.post('/masters/warehouses/', data);
  return response.data;
};

export const updateWarehouse = async (id: number, data: Partial<any>) => {
  const response = await apiClient.put(`/masters/warehouses/${id}/`, data);
  return response.data;
};

export const deleteWarehouse = async (id: number) => {
  const response = await apiClient.delete(`/masters/warehouses/${id}/`);
  return response.data;
};