'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DispatchForm } from '@/components/commission/DispatchForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewDispatchPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/commission/dispatches');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dispatches
        </Button>
        <h1 className="text-3xl font-bold">New Dispatch</h1>
        <p className="text-muted-foreground">
          Create a new commission dispatch/lifting transaction
        </p>
      </div>

      <DispatchForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}