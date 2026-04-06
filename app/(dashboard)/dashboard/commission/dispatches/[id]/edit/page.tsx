'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DispatchForm } from '@/components/commission/DispatchForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EditDispatchPage() {
  const router = useRouter();
  const params = useParams();
  const dispatchId = params.id as string;

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
        <h1 className="text-3xl font-bold">Edit Dispatch</h1>
        <p className="text-muted-foreground">
          Update dispatch/lifting transaction details
        </p>
      </div>

      <DispatchForm
        dispatchId={dispatchId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}