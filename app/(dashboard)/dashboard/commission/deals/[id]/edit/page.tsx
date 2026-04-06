'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DealScreen from '../../_components/DealScreen';
import { getCommissionDeal } from '@/lib/api/commission';
import { CommissionDealDetail } from '@/lib/types/commission';

export default function EditCommissionDealPage() {
  const params = useParams<{ id: string }>();
  const [deal, setDeal] = useState<CommissionDealDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeal = async () => {
      try {
        const data = await getCommissionDeal(params.id);
        setDeal(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.id) loadDeal();
  }, [params]);

  if (isLoading) return <div className="p-6">Loading deal...</div>;
  if (!deal) return <div className="p-6">Deal not found.</div>;

  return <DealScreen mode="edit" initialData={deal} />;
}