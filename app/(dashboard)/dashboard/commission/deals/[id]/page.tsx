'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDealSheet, getCommissionDeal } from '@/lib/api/commission';
import { CommissionDealDetail } from '@/lib/types/commission';

export default function CommissionDealDetailPage() {
  const params = useParams<{ id: string }>();
  const [deal, setDeal] = useState<CommissionDealDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeal = async () => {
      try {
        // Prefer server-side computed deal sheet when available
        let data = null;
        try {
          data = await getDealSheet(params.id);
        } catch (e) {
          // fallback to basic deal endpoint
          data = await getCommissionDeal(params.id);
        }
        setDeal(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.id) loadDeal();
  }, [params]);

  if (isLoading) return <div className="p-6">Loading deal sheet...</div>;
  if (!deal) return <div className="p-6">Deal not found.</div>;

  const totalCommission =
    Number(deal.total_buyer_commission || 0) + Number(deal.total_seller_commission || 0);

  return (
    <div className="space-y-6 p-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Deal Sheet - {deal.deal_id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Seller: {deal.seller_name || '-'} | Principal Buyer: {deal.principal_buyer_name || '-'}
            </p>
            <p className="text-sm text-gray-500">
              Commodity: {deal.commodity_name || '-'} | Deal Date: {deal.deal_date}
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`/dashboard/commission/deals/${deal.id}/edit`}>
              <Button>Edit Deal</Button>
            </Link>
            <Link href="/dashboard/commission/deals">
              <Button variant="outline">Back to List</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Contract Qty</p>
          <h2 className="text-2xl font-bold mt-2">{deal.total_quantity_mt} MT</h2>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500">Lifted Qty</p>
          <h2 className="text-2xl font-bold mt-2">{deal.quantity_lifted_mt} MT</h2>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500">Remaining Qty</p>
          <h2 className="text-2xl font-bold mt-2">{deal.quantity_remaining_mt} MT</h2>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500">Status</p>
          <h2 className="text-2xl font-bold mt-2 capitalize">
            {String(deal.status).replace('_', ' ')}
          </h2>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500">Buyer-side Commission</p>
          <h2 className="text-2xl font-bold mt-2">{deal.total_buyer_commission}</h2>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500">Seller-side Commission</p>
          <h2 className="text-2xl font-bold mt-2">{deal.total_seller_commission}</h2>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Commission Earned</p>
          <h2 className="text-2xl font-bold mt-2">{totalCommission.toFixed(2)}</h2>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-gray-500">Commission Outstanding</p>
          <h2 className="text-2xl font-bold mt-2">{deal.commission_outstanding}</h2>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Receiver Schedule</h2>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2 text-left">Receiver</th>
                <th className="border p-2 text-left">Invoice Party</th>
                <th className="border p-2 text-left">Payment Responsibility</th>
                <th className="border p-2 text-right">Expected Qty</th>
                <th className="border p-2 text-right">Lifted Qty</th>
                <th className="border p-2 text-right">Remaining Qty</th>
                <th className="border p-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {deal.receivers?.length ? (
                deal.receivers.map((row) => (
                  <tr key={row.id}>
                    <td className="border p-2">{row.receiver_party_name || '-'}</td>
                    <td className="border p-2">{row.invoice_party_name || '-'}</td>
                    <td className="border p-2">{row.payment_responsibility_party_name || '-'}</td>
                    <td className="border p-2 text-right">{row.expected_quantity_mt}</td>
                    <td className="border p-2 text-right">{row.lifted_quantity_mt || '0.00'}</td>
                    <td className="border p-2 text-right">{row.remaining_quantity_mt || '0.00'}</td>
                    <td className="border p-2">{row.remarks || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border p-2 text-center" colSpan={7}>
                    No receiver schedule added.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Liftings</h2>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Vehicle No</th>
                <th className="border p-2 text-right">Qty</th>
                <th className="border p-2 text-left">Principal Buyer</th>
                <th className="border p-2 text-left">Invoice Party</th>
                <th className="border p-2 text-left">Receiver Party</th>
                <th className="border p-2 text-left">Payment Party</th>
                <th className="border p-2 text-left">Payment Status</th>
                <th className="border p-2 text-left">Posting Ref</th>
              </tr>
            </thead>
            <tbody>
              {deal.liftings?.length ? (
                deal.liftings.map((lifting) => (
                  <tr key={lifting.id}>
                    <td className="border p-2">{lifting.lifting_date}</td>
                    <td className="border p-2">{lifting.vehicle_no}</td>
                    <td className="border p-2 text-right">{lifting.quantity_mt}</td>
                    <td className="border p-2">{lifting.principal_buyer_name || '-'}</td>
                    <td className="border p-2">{lifting.invoice_party_name || '-'}</td>
                    <td className="border p-2">{lifting.receiver_party_name || '-'}</td>
                    <td className="border p-2">{lifting.payment_party_name || '-'}</td>
                    <td className="border p-2">{lifting.payment_status}</td>
                    <td className="border p-2">{lifting.posting_reference || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border p-2 text-center" colSpan={9}>
                    No liftings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}