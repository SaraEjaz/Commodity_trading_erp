'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '@/lib/api/client';
import { createCommissionDeal, updateCommissionDeal } from '@/lib/api/commission';
import {
  CommissionDealDetail,
  CommissionDealFormData,
  CommissionDealReceiverRow,
} from '@/lib/types/commission';

type PartyOption = {
  id: number;
  party_name: string;
  party_type?: string;
  business_line_tag?: string;
};

type CommodityOption = {
  id: number;
  name: string;
  unit?: string;
};

type DealFormProps = {
  mode: 'create' | 'edit';
  initialData?: CommissionDealDetail | null;
};

type AppSelectOption = {
  value: string;
  label: string;
};

type AppSelectProps = {
  value?: string;
  placeholder: string;
  options: AppSelectOption[];
  disabled?: boolean;
  onValueChange: (value: string) => void;
};

function AppSelect({
  value,
  placeholder,
  options,
  disabled,
  onValueChange,
}: AppSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const PARTY_API = '/masters/parties/';
const COMMODITY_API = '/commodities/commodities/';

const emptyReceiver = (): CommissionDealReceiverRow => ({
  receiver_party_id: null,
  invoice_party_id: null,
  payment_responsibility_party_id: null,
  expected_quantity_mt: '0.00',
  remarks: '',
});

const createInitialForm = (): CommissionDealFormData => ({
  deal_date: '',
  delivery_period_from: '',
  delivery_period_to: '',
  commodity_id: null,
  total_quantity_mt: '0.00',
  unit: 'MT',
  commercial_rate: '0.00',
  seller_party_id: null,
  seller_rate_per_mt: '0.00',
  principal_buyer_party_id: null,
  buyer_rate_per_mt: '0.00',
  commission_applicable: true,
  commission_basis: 'per_mt',
  commission_payer: 'both',
  buyer_side_commission_rate: '0.00',
  seller_side_commission_rate: '0.00',
  terms: '',
  remarks: '',
  status: 'open',
  receivers: [emptyReceiver()],
});

export default function DealForm({ mode, initialData }: DealFormProps) {
  const router = useRouter();

  const [form, setForm] = useState<CommissionDealFormData>(createInitialForm());
  const [parties, setParties] = useState<PartyOption[]>([]);
  const [commodities, setCommodities] = useState<CommodityOption[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMasters, setIsLoadingMasters] = useState(true);

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    if (!initialData) return;

    setForm({
      deal_id: initialData.deal_id,
      deal_date: initialData.deal_date || '',
      delivery_period_from: initialData.delivery_period_from || '',
      delivery_period_to: initialData.delivery_period_to || '',
      commodity_id: initialData.commodity_id,
      total_quantity_mt: String(initialData.total_quantity_mt ?? '0.00'),
      unit: initialData.unit || 'MT',
      commercial_rate: String(initialData.commercial_rate ?? '0.00'),
      seller_party_id: initialData.seller_party_id,
      seller_rate_per_mt: String(initialData.seller_rate_per_mt ?? '0.00'),
      principal_buyer_party_id: initialData.principal_buyer_party_id,
      buyer_rate_per_mt: String(initialData.buyer_rate_per_mt ?? '0.00'),
      commission_applicable: Boolean(initialData.commission_applicable),
      commission_basis: initialData.commission_basis || 'per_mt',
      commission_payer: initialData.commission_payer || 'both',
      buyer_side_commission_rate: String(initialData.buyer_side_commission_rate ?? '0.00'),
      seller_side_commission_rate: String(initialData.seller_side_commission_rate ?? '0.00'),
      terms: initialData.terms || '',
      remarks: initialData.remarks || '',
      status: initialData.status || 'open',
      receivers:
        initialData.receivers?.length
          ? initialData.receivers.map((row) => ({
              id: row.id,
              receiver_party_id: row.receiver_party_id ?? null,
              invoice_party_id: row.invoice_party_id ?? null,
              payment_responsibility_party_id: row.payment_responsibility_party_id ?? null,
              expected_quantity_mt: String(row.expected_quantity_mt ?? '0.00'),
              lifted_quantity_mt: row.lifted_quantity_mt,
              remaining_quantity_mt: row.remaining_quantity_mt,
              remarks: row.remarks || '',
            }))
          : [emptyReceiver()],
    });
  }, [initialData]);

  const loadMasterData = async () => {
    try {
      setIsLoadingMasters(true);

      const [partyRes, commodityRes] = await Promise.all([
        apiClient.get(PARTY_API),
        apiClient.get(COMMODITY_API),
      ]);

      const partyData = partyRes.data.results || partyRes.data || [];
      const commodityData = commodityRes.data.results || commodityRes.data || [];

      setParties(partyData);
      setCommodities(commodityData);
    } catch (error) {
      console.error(error);
      toast.error('Could not load parties/commodities. Check the two master API URLs in DealForm.tsx.');
    } finally {
      setIsLoadingMasters(false);
    }
  };

  const handleChange = (field: keyof CommissionDealFormData, value: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReceiverChange = (
    index: number,
    field: keyof CommissionDealReceiverRow,
    value: any
  ) => {
    setForm((prev) => {
      const updated = [...prev.receivers];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, receivers: updated };
    });
  };

  const addReceiverRow = () => {
    setForm((prev) => ({
      ...prev,
      receivers: [...prev.receivers, emptyReceiver()],
    }));
  };

  const removeReceiverRow = (index: number) => {
    setForm((prev) => {
      if (prev.receivers.length === 1) return prev;
      const updated = prev.receivers.filter((_, i) => i !== index);
      return { ...prev, receivers: updated };
    });
  };

  const receiverTotal = useMemo(() => {
    return form.receivers.reduce((sum, row) => {
      return sum + Number(row.expected_quantity_mt || 0);
    }, 0);
  }, [form.receivers]);

  const buildPayload = (): CommissionDealFormData => {
    return {
      ...form,
      commodity_id: form.commodity_id ? Number(form.commodity_id) : null,
      seller_party_id: form.seller_party_id ? Number(form.seller_party_id) : null,
      principal_buyer_party_id: form.principal_buyer_party_id
        ? Number(form.principal_buyer_party_id)
        : null,
      receivers: form.receivers.map((row) => ({
        ...row,
        receiver_party_id: row.receiver_party_id ? Number(row.receiver_party_id) : null,
        invoice_party_id: row.invoice_party_id ? Number(row.invoice_party_id) : null,
        payment_responsibility_party_id: row.payment_responsibility_party_id
          ? Number(row.payment_responsibility_party_id)
          : null,
      })),
    };
  };

  const validateBeforeSave = () => {
    if (!form.deal_date) return 'Deal date is required.';
    if (!form.delivery_period_from) return 'Delivery period from is required.';
    if (!form.delivery_period_to) return 'Delivery period to is required.';
    if (!form.commodity_id) return 'Commodity is required.';
    if (!form.seller_party_id) return 'Seller party is required.';
    if (!form.principal_buyer_party_id) return 'Principal buyer is required.';
    if (Number(form.total_quantity_mt) <= 0) return 'Total quantity must be greater than zero.';
    if (receiverTotal > Number(form.total_quantity_mt)) {
      return 'Receiver total cannot exceed total deal quantity.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateBeforeSave();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSaving(true);
      const payload = buildPayload();

      if (mode === 'create') {
        const created = await createCommissionDeal(payload);
        toast.success('Deal created successfully');
        router.push(`/dashboard/commission/deals/${created.id}`);
      } else if (mode === 'edit' && initialData?.id) {
        const updated = await updateCommissionDeal(initialData.id, payload);
        toast.success('Deal updated successfully');
        router.push(`/dashboard/commission/deals/${updated.id}`);
      }
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.detail ||
        JSON.stringify(error?.response?.data) ||
        'Could not save deal';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold">
          {mode === 'create' ? 'Create Commission Deal' : 'Edit Commission Deal'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          This form creates the main Meals / Commission deal with seller, buyer, commission rules,
          and receiver schedule.
        </p>
      </Card>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">1. Deal Header</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Deal Date</Label>
              <Input
                type="date"
                value={form.deal_date}
                onChange={(e) => handleChange('deal_date', e.target.value)}
              />
            </div>

            <div>
              <Label>Delivery Period From</Label>
              <Input
                type="date"
                value={form.delivery_period_from}
                onChange={(e) => handleChange('delivery_period_from', e.target.value)}
              />
            </div>

            <div>
              <Label>Delivery Period To</Label>
              <Input
                type="date"
                value={form.delivery_period_to}
                onChange={(e) => handleChange('delivery_period_to', e.target.value)}
              />
            </div>

            <div>
              <Label>Commodity</Label>
              <AppSelect
                value={form.commodity_id ? String(form.commodity_id) : undefined}
                placeholder="Select commodity"
                disabled={isLoadingMasters}
                options={commodities.map((commodity) => ({
                  value: String(commodity.id),
                  label: commodity.name,
                }))}
                onValueChange={(value) => handleChange('commodity_id', Number(value))}
              />
            </div>

            <div>
              <Label>Total Quantity (MT)</Label>
              <Input
                value={form.total_quantity_mt}
                onChange={(e) => handleChange('total_quantity_mt', e.target.value)}
              />
            </div>

            <div>
              <Label>Unit</Label>
              <Input
                value={form.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
              />
            </div>

            <div>
              <Label>Commercial Rate</Label>
              <Input
                value={form.commercial_rate}
                onChange={(e) => handleChange('commercial_rate', e.target.value)}
              />
            </div>

            <div>
              <Label>Status</Label>
              <AppSelect
                value={form.status}
                placeholder="Select status"
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'partially_executed', label: 'Partially Executed' },
                  { value: 'closed', label: 'Closed' },
                ]}
                onValueChange={(value) => handleChange('status', value as any)}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">2. Parties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Seller Party</Label>
              <AppSelect
                value={form.seller_party_id ? String(form.seller_party_id) : undefined}
                placeholder="Select seller"
                disabled={isLoadingMasters}
                options={parties.map((party) => ({
                  value: String(party.id),
                  label: party.party_name,
                }))}
                onValueChange={(value) => handleChange('seller_party_id', Number(value))}
              />
            </div>

            <div>
              <Label>Seller Rate per MT</Label>
              <Input
                value={form.seller_rate_per_mt}
                onChange={(e) => handleChange('seller_rate_per_mt', e.target.value)}
              />
            </div>

            <div>
              <Label>Principal Buyer Party</Label>
              <AppSelect
                value={
                  form.principal_buyer_party_id
                    ? String(form.principal_buyer_party_id)
                    : undefined
                }
                placeholder="Select principal buyer"
                disabled={isLoadingMasters}
                options={parties.map((party) => ({
                  value: String(party.id),
                  label: party.party_name,
                }))}
                onValueChange={(value) =>
                  handleChange('principal_buyer_party_id', Number(value))
                }
              />
            </div>

            <div>
              <Label>Buyer Rate per MT</Label>
              <Input
                value={form.buyer_rate_per_mt}
                onChange={(e) => handleChange('buyer_rate_per_mt', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">3. Commission Setup</h2>

          <div className="mb-4 flex items-center gap-2">
            <Input
                id="commission_applicable"
                type="checkbox"
                checked={form.commission_applicable}
                onChange={(e) => handleChange('commission_applicable', e.target.checked)}
                className="h-4 w-4"
            />
            <Label htmlFor="commission_applicable">Commission Applicable</Label>
          </div>

          {form.commission_applicable && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Commission Basis</Label>
                <AppSelect
                  value={form.commission_basis}
                  placeholder="Select commission basis"
                  options={[
                    { value: 'per_mt', label: 'Per MT' },
                    { value: 'percentage', label: 'Percentage' },
                    { value: 'fixed', label: 'Fixed' },
                  ]}
                  onValueChange={(value) => handleChange('commission_basis', value as any)}
                />
              </div>

              <div>
                <Label>Commission Payer</Label>
                <AppSelect
                  value={form.commission_payer}
                  placeholder="Select commission payer"
                  options={[
                    { value: 'buyer', label: 'Buyer' },
                    { value: 'seller', label: 'Seller' },
                    { value: 'both', label: 'Both' },
                  ]}
                  onValueChange={(value) => handleChange('commission_payer', value as any)}
                />
              </div>

              <div>
                <Label>Buyer-side Commission</Label>
                <Input
                  value={form.buyer_side_commission_rate}
                  onChange={(e) => handleChange('buyer_side_commission_rate', e.target.value)}
                  disabled={form.commission_payer === 'seller'}
                />
              </div>

              <div>
                <Label>Seller-side Commission</Label>
                <Input
                  value={form.seller_side_commission_rate}
                  onChange={(e) => handleChange('seller_side_commission_rate', e.target.value)}
                  disabled={form.commission_payer === 'buyer'}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">4. Receiver Schedule</h2>

          <div className="mb-3 text-sm text-gray-500">
            Receiver total: <strong>{receiverTotal.toFixed(2)} MT</strong>
          </div>

          <div className="space-y-4">
            {form.receivers.map((row, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Receiver Party</Label>
                    <AppSelect
                      value={row.receiver_party_id ? String(row.receiver_party_id) : undefined}
                      placeholder="Select receiver"
                      disabled={isLoadingMasters}
                      options={parties.map((party) => ({
                        value: String(party.id),
                        label: party.party_name,
                      }))}
                      onValueChange={(value) =>
                        handleReceiverChange(index, 'receiver_party_id', Number(value))
                      }
                    />
                  </div>

                  <div>
                    <Label>Expected Qty (MT)</Label>
                    <Input
                      value={row.expected_quantity_mt}
                      onChange={(e) =>
                        handleReceiverChange(index, 'expected_quantity_mt', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Invoice Party</Label>
                    <AppSelect
                      value={row.invoice_party_id ? String(row.invoice_party_id) : undefined}
                      placeholder="Select invoice party"
                      disabled={isLoadingMasters}
                      options={parties.map((party) => ({
                        value: String(party.id),
                        label: party.party_name,
                      }))}
                      onValueChange={(value) =>
                        handleReceiverChange(index, 'invoice_party_id', Number(value))
                      }
                    />
                  </div>

                  <div>
                    <Label>Payment Responsibility</Label>
                    <AppSelect
                      value={
                        row.payment_responsibility_party_id
                          ? String(row.payment_responsibility_party_id)
                          : undefined
                      }
                      placeholder="Select payment party"
                      disabled={isLoadingMasters}
                      options={parties.map((party) => ({
                        value: String(party.id),
                        label: party.party_name,
                      }))}
                      onValueChange={(value) =>
                        handleReceiverChange(
                          index,
                          'payment_responsibility_party_id',
                          Number(value)
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label>Remarks</Label>
                    <Input
                      value={row.remarks || ''}
                      onChange={(e) => handleReceiverChange(index, 'remarks', e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeReceiverRow(index)}
                  >
                    Remove Row
                  </Button>
                </div>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={addReceiverRow}>
              + Add Receiver Row
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">5. Terms and Remarks</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Terms</Label>
              <Textarea
                className="min-h-[100px]"
                value={form.terms}
                onChange={(e) => handleChange('terms', e.target.value)}
              />
            </div>

            <div>
              <Label>Remarks</Label>
              <Textarea
                className="min-h-[100px]"
                value={form.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving...' : mode === 'create' ? 'Save Deal' : 'Update Deal'}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/commission/deals')}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}