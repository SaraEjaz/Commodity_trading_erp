'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { is_authenticated, is_hydrated } = useSelector((state: RootState) => state.auth);
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    if (is_hydrated) {
      if (!is_authenticated) {
        router.push('/login');
      } else {
        setIsReady(true);
      }
    }
  }, [is_authenticated, is_hydrated, router]);

  if (!is_hydrated || (!is_authenticated && !isReady)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
