'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewCommissionDispatchPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const hasAccess = useModuleAccess('commission');

  if (!isAuthenticated || !hasAccess) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record New Dispatch</h1>
          <p className="text-gray-500">
            Create a new lifting/dispatch transaction for a commission deal
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-gray-500">Dispatch form will be implemented here</p>
      </div>
    </div>
  );
}