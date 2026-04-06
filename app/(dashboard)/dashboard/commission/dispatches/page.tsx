'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import apiClient from '@/lib/api/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Eye, Edit2, Truck } from 'lucide-react';

interface CommissionLifting {
  id: number;
  lifting_id: string;
  deal_id: string;
  lifting_date: string;
  quantity_mt: string;
  principal_buyer_name?: string;
  receiver_party_name?: string;
  invoice_party_name?: string;
  payment_party_name?: string;
  buyer_commission: string;
  seller_commission: string;
  payment_status: string;
  vehicle_no: string;
  posting_reference: string;
}

export default function CommissionDispatchesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const hasAccess = useModuleAccess('commission');

  const [dispatches, setDispatches] = useState<CommissionLifting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!hasAccess) {
      router.push('/dashboard');
      return;
    }
    fetchDispatches();
  }, [isAuthenticated, hasAccess]);

  const fetchDispatches = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('payment_status', statusFilter);

      const response = await apiClient.get(`/commission/liftings/?${params}`);
      setDispatches(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch dispatches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [searchTerm, statusFilter]);

  const handleViewDispatch = (id: number) => {
    router.push(`/dashboard/commission/dispatches/${id}`);
  };

  const handleEditDispatch = (id: number) => {
    router.push(`/dashboard/commission/dispatches/${id}/edit`);
  };

  const handleCreateNew = () => {
    router.push('/dashboard/commission/dispatches/new');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partially_paid: 'bg-blue-100 text-blue-800',
      disputed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Commission Dispatches</h1>
          <p className="text-gray-500">Manage lifting/dispatch transactions</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Dispatch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispatches</CardTitle>
          <CardDescription>Lifting and dispatch transactions with commission tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
            <Input
              placeholder="Search by lifting ID, vehicle, deal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lifting ID</TableHead>
                <TableHead>Deal ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Quantity (MT)</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatches.map((dispatch) => (
                <TableRow key={dispatch.id}>
                  <TableCell className="font-medium">{dispatch.lifting_id}</TableCell>
                  <TableCell>{dispatch.deal_id}</TableCell>
                  <TableCell>{dispatch.lifting_date}</TableCell>
                  <TableCell>{dispatch.quantity_mt}</TableCell>
                  <TableCell>{dispatch.receiver_party_name}</TableCell>
                  <TableCell>
                    ₹{(Number(dispatch.buyer_commission) + Number(dispatch.seller_commission)).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(dispatch.payment_status)}>
                      {dispatch.payment_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDispatch(dispatch.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDispatch(dispatch.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {dispatches.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No dispatches found</p>
              <Button onClick={handleCreateNew} className="mt-4">
                Create First Dispatch
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
