'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreatableCombobox from './CreatableCombobox';
import { getParties, createParty, getUofs, createUof } from '@/lib/api/masters';
import { commoditiesAPI } from '@/lib/api/commodities';
import { createCommissionDeal, updateCommissionDeal } from '@/lib/api/commission';
import { useRouter } from 'next/navigation';

const receiverSchema = z.object({
  receiver_party: z.number().min(1),
  expected_quantity_mt: z.number().min(0.0001),
  invoice_party: z.number().nullable(),
  payment_responsibility_party: z.number().nullable(),
  remarks: z.string().optional(),
});

const dealSchema = z.object({
  commodity: z.number().min(1),
  uof: z.number().nullable(),
  total_quantity_mt: z.number().min(0.0001),
  commercial_rate: z.number().min(0),
  seller_party: z.number().min(1),
  principal_buyer_party: z.number().min(1),
  commission_applicable: z.boolean().optional(),
  commission_basis: z.string().optional(),
  commission_payer: z.string().optional(),
  buyer_side_commission_rate: z.number().optional(),
  seller_side_commission_rate: z.number().optional(),
  receivers: z.array(receiverSchema).optional(),
});

type DealFormValues = z.infer<typeof dealSchema>;

export default function DealScreen({ mode = 'create', initialData = null }: { mode?: 'create' | 'edit'; initialData?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [uofs, setUofs] = useState<any[]>([]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      commission_applicable: true,
      commission_basis: 'per_mt',
      commission_payer: 'buyer',
      receivers: [],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'receivers' as any });

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getParties();
        setParties(p.results || p);
      } catch (e) { console.error(e); }

      try {
        const c = await commoditiesAPI.list();
        setCommodities(c.results || c);
      } catch (e) { console.error(e); }

      try {
        const u = await getUofs();
        setUofs(u.results || u);
      } catch (e) { console.error(e); }
    };
    load();
  }, []);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // hydrate form
      const map = {
        commodity: initialData.commodity,
        uof: initialData.uof || null,
        total_quantity_mt: Number(initialData.total_quantity_mt || 0),
        commercial_rate: Number(initialData.commercial_rate || 0),
        seller_party: initialData.seller_party,
        principal_buyer_party: initialData.principal_buyer_party,
        commission_applicable: !!initialData.commission_applicable,
        commission_basis: initialData.commission_basis,
        commission_payer: initialData.commission_payer,
        buyer_side_commission_rate: initialData.buyer_side_commission_rate,
        seller_side_commission_rate: initialData.seller_side_commission_rate,
        receivers: (initialData.receivers || []).map((r: any) => ({
          receiver_party: r.receiver_party,
          expected_quantity_mt: Number(r.expected_quantity_mt),
          invoice_party: r.invoice_party || null,
          payment_responsibility_party: r.payment_responsibility_party || null,
          remarks: r.remarks || '',
        }))
      };
      Object.entries(map).forEach(([k, v]) => setValue(k as any, v as any));
    }
  }, [mode, initialData, setValue]);

  const watchedQty = watch('total_quantity_mt') || 0;
  const watchedRate = watch('commercial_rate') || 0;

  const totalAmount = useMemo(() => {
    return (Number(watchedQty) || 0) * (Number(watchedRate) || 0);
  }, [watchedQty, watchedRate]);

  useEffect(() => {
    // keep total_amount in form if needed elsewhere
    // no-op for now
  }, [totalAmount]);

  const onSubmit = async (data: DealFormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        total_quantity_mt: Number(data.total_quantity_mt),
        commercial_rate: Number(data.commercial_rate),
        receivers: (data.receivers || []).map(r => ({
          ...r,
          expected_quantity_mt: Number((r as any).expected_quantity_mt),
        })),
        total_amount: Number(totalAmount || 0),
      };

      if (mode === 'create') {
        await createCommissionDeal(payload as any);
      } else {
        // initialData should have id
        await updateCommissionDeal(initialData.id, payload as any);
      }
      router.push('/dashboard/commission/deals');
    } catch (e) {
      console.error(e);
      alert('Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  const createPartyLocal = async (label: string) => {
    const created = await createParty({ party_code: label.slice(0,20).toUpperCase(), party_name: label, party_type: 'buyer', is_active: true } as any);
    // refresh parties
    const lists = await getParties();
    setParties(lists.results || lists);
    return { id: created.id, label: created.party_name };
  };

  const createCommodityLocal = async (label: string) => {
    const created = await commoditiesAPI.create({ name: label, symbol: label.slice(0,10).toUpperCase(), category: commodities[0]?.category || 1, unit: 'MT', current_price: 0 });
    const lists = await commoditiesAPI.list();
    setCommodities(lists.results || lists);
    return { id: created.id, label: `${created.code || created.symbol || ''} - ${created.name}` };
  };

  const createUofLocal = async (label: string) => {
    const created = await createUof({ code: label.toUpperCase(), name: label });
    const lists = await getUofs();
    setUofs(lists.results || lists);
    return { id: created.id, label: `${created.code || ''} - ${created.name}` };
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{mode === 'create' ? 'New Deal' : 'Edit Deal'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Deal Info */}
              <div>
                <Label>Item</Label>
                <CreatableCombobox
                  placeholder="Search or create item"
                  value={watch('commodity') as any}
                  onChange={(id) => setValue('commodity' as any, id)}
                  fetchOptions={async (q) => (commodities || []).filter(c => {
                    if (!q) return true;
                    return (String(c.name || '').toLowerCase().includes(q.toLowerCase()) || String(c.code || c.symbol || '').toLowerCase().includes(q.toLowerCase()));
                  }).map((c:any) => ({ id: c.id, label: `${c.code || c.symbol || ''} - ${c.name}` }))}
                  createOption={createCommodityLocal}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Total Quantity</Label>
                  <Input type="number" step="0.01" {...register('total_quantity_mt', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>UOF</Label>
                  <CreatableCombobox
                    placeholder="UOF (e.g. MT)"
                    value={watch('uof') as any}
                    onChange={(id) => setValue('uof' as any, id)}
                    fetchOptions={async (q) => (uofs || []).filter(u => {
                      if (!q) return true;
                      return (String(u.name || '').toLowerCase().includes(q.toLowerCase()) || String(u.code || '').toLowerCase().includes(q.toLowerCase()));
                    }).map((u:any) => ({ id: u.id, label: `${u.code || ''} - ${u.name}` }))}
                    createOption={createUofLocal}
                  />
                </div>
                <div>
                  <Label>Commercial Rate</Label>
                  <Input type="number" step="0.01" {...register('commercial_rate', { valueAsNumber: true })} />
                </div>
              </div>

              <div>
                <Label>Seller</Label>
                <CreatableCombobox
                  placeholder="Seller party"
                  value={watch('seller_party') as any}
                  onChange={(id) => setValue('seller_party' as any, id)}
                  fetchOptions={async (q) => (parties || []).filter(p => !q || p.party_name.toLowerCase().includes(q.toLowerCase())).map((p:any) => ({ id: p.id, label: p.party_name }))}
                  createOption={createPartyLocal}
                />
              </div>

              <div>
                <Label>Main Buyer</Label>
                <CreatableCombobox
                  placeholder="Main buyer party"
                  value={watch('principal_buyer_party') as any}
                  onChange={(id) => setValue('principal_buyer_party' as any, id)}
                  fetchOptions={async (q) => (parties || []).filter(p => !q || p.party_name.toLowerCase().includes(q.toLowerCase())).map((p:any) => ({ id: p.id, label: p.party_name }))}
                  createOption={createPartyLocal}
                />
              </div>

              {/* Receiver schedule */}
              <div>
                <Label>Receiver Schedule</Label>
                <div className="space-y-2">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <CreatableCombobox
                          placeholder="Receiver"
                          value={(field as any).receiver_party}
                          onChange={(id) => setValue(`receivers.${idx}.receiver_party` as any, id)}
                          fetchOptions={async (q) => (parties || []).filter(p => !q || p.party_name.toLowerCase().includes(q.toLowerCase())).map((p:any) => ({ id: p.id, label: p.party_name }))}
                          createOption={createPartyLocal}
                        />
                      </div>
                      <div>
                        <Input type="number" step="0.01" placeholder="Qty" {...register(`receivers.${idx}.expected_quantity_mt` as const, { valueAsNumber: true })} />
                      </div>
                      <div>
                        <CreatableCombobox
                          placeholder="Invoice Party"
                          value={(field as any).invoice_party}
                          onChange={(id) => setValue(`receivers.${idx}.invoice_party` as any, id)}
                          fetchOptions={async (q) => (parties || []).filter(p => !q || p.party_name.toLowerCase().includes(q.toLowerCase())).map((p:any) => ({ id: p.id, label: p.party_name }))}
                          createOption={createPartyLocal}
                        />
                      </div>
                      <div>
                        <Input placeholder="Remarks" {...register(`receivers.${idx}.remarks` as const)} />
                      </div>
                      <div>
                        <Button type="button" variant="destructive" onClick={() => remove(idx)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <Button type="button" onClick={() => append({ receiver_party: null, expected_quantity_mt: 0, invoice_party: null, payment_responsibility_party: null, remarks: '' })}>Add Receiver</Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted">Total Amount</div>
                  <div className="text-lg font-semibold">{totalAmount.toFixed(2)}</div>
                </div>
                <div>
                  <Button type="submit" disabled={loading}>{mode === 'create' ? 'Create Deal' : 'Save Changes'}</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Contract Quantity: {watchedQty}</div>
              <div>Receiver Total: {(fields as any).reduce((s:any, _f:any, i:number) => {
                const val = Number((watch(`receivers.${i}.expected_quantity_mt`) as any) || 0);
                return s + val;
              }, 0)}</div>
              <div>Total Amount: {totalAmount.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
