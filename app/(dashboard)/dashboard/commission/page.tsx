'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function CommissionDashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Commission Dashboard</h1>
        <p className="text-gray-500">
          Overview of commission deals, liftings, collections, and outstanding balances
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Open Deals</p>
          <h2 className="mt-2 text-2xl font-bold">0</h2>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Lifted Qty</p>
          <h2 className="mt-2 text-2xl font-bold">0.00 MT</h2>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Commission Outstanding</p>
          <h2 className="mt-2 text-2xl font-bold">0.00</h2>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Commission Received</p>
          <h2 className="mt-2 text-2xl font-bold">0.00</h2>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <p className="mt-2 text-sm text-gray-500">
          Your Commission dashboard is now separate from the deals page.
        </p>
      </div>
    </div>
  );
}
