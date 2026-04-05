export interface CommissionDealReceiverRow {
  id?: number;
  receiver_party_id: number | null;
  invoice_party_id: number | null;
  payment_responsibility_party_id: number | null;
  expected_quantity_mt: string;
  lifted_quantity_mt?: string;
  remaining_quantity_mt?: string;
  remarks?: string;
  receiver_party_name?: string;
  invoice_party_name?: string;
  payment_responsibility_party_name?: string;
}

export interface CommissionLiftingMini {
  id: number;
  lifting_id: string;
  lifting_date: string;
  vehicle_no: string;
  quantity_mt: string;
  principal_buyer_name?: string;
  invoice_party_name?: string;
  receiver_party_name?: string;
  payment_party_name?: string;
  buyer_commission: string;
  seller_commission: string;
  payment_status: string;
  posting_reference: string;
  notes?: string;
}

export interface CommissionDealFormData {
  deal_id?: string;
  deal_date: string;
  delivery_period_from: string;
  delivery_period_to: string;

  commodity_id: number | null;
  total_quantity_mt: string;
  unit: string;
  commercial_rate: string;

  seller_party_id: number | null;
  seller_rate_per_mt: string;

  principal_buyer_party_id: number | null;
  buyer_rate_per_mt: string;

  commission_applicable: boolean;
  commission_basis: 'per_mt' | 'percentage' | 'fixed';
  commission_payer: 'buyer' | 'seller' | 'both';
  buyer_side_commission_rate: string;
  seller_side_commission_rate: string;

  terms: string;
  remarks: string;
  status: 'open' | 'partially_executed' | 'closed';

  receivers: CommissionDealReceiverRow[];
}

export interface CommissionDealDetail extends CommissionDealFormData {
  id: number;
  commodity_name?: string;
  seller_name?: string;
  principal_buyer_name?: string;
  quantity_lifted_mt: string;
  quantity_remaining_mt: string;
  total_buyer_commission: string;
  total_seller_commission: string;
  commission_received: string;
  commission_outstanding: string;
  liftings: CommissionLiftingMini[];
}