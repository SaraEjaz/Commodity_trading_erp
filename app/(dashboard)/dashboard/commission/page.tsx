'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page redirects /dashboard/commission → /dashboard/commission/deals
// which is the main commission deals list page.
export default function CommissionIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/commission/deals');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
}
