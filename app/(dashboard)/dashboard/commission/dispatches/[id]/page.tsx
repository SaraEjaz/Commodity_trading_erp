'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCommissionDispatch, deleteCommissionDispatch } from '@/lib/api/commission';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DispatchDetail {
  id: number;
  deal: {
    id: number;
    deal_number: string;
    party: {
      id: number;
      name: string;
    };
    commodity: {
      id: number;
      name: string;
    };
  };
  lifting_date: string;
  quantity: number;
  rate: number;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function DispatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatchId = params.id as string;
  const { toast } = useToast();

  const [dispatch, setDispatch] = useState<DispatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadDispatch = async () => {
      try {
        const data = await getCommissionDispatch(dispatchId);
        setDispatch(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load dispatch details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (dispatchId) {
      loadDispatch();
    }
  }, [dispatchId, toast]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCommissionDispatch(dispatchId);
      toast({
        title: 'Success',
        description: 'Dispatch deleted successfully',
      });
      router.push('/dashboard/commission/dispatches');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete dispatch',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      paid: 'default',
      overdue: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dispatch details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dispatch) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-muted-foreground">Dispatch not found</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dispatch Details</h1>
            <p className="text-muted-foreground">
              Dispatch #{dispatch.id} - {dispatch.deal?.deal_number}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/commission/dispatches/${dispatchId}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Dispatch</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this dispatch? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Deal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Deal Number</label>
              <p className="text-sm">{dispatch.deal?.deal_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Party</label>
              <p className="text-sm">{dispatch.deal?.party?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Commodity</label>
              <p className="text-sm">{dispatch.deal?.commodity?.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Details */}
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Lifting Date</label>
              <p className="text-sm">{new Date(dispatch.lifting_date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Quantity</label>
              <p className="text-sm">{dispatch.quantity} MT</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rate</label>
              <p className="text-sm">₹{dispatch.rate.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <p className="text-sm">₹{dispatch.amount.toLocaleString()}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Commission Rate</label>
              <p className="text-sm">{dispatch.commission_rate}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Commission Amount</label>
              <p className="text-sm">₹{dispatch.commission_amount.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
              <div className="mt-1">{getPaymentStatusBadge(dispatch.payment_status)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dispatch.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-sm mt-1">{dispatch.notes}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <p className="text-sm">{new Date(dispatch.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                <p className="text-sm">{new Date(dispatch.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}