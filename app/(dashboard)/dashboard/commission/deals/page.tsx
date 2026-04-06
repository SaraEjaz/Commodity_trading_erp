'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import apiClient from '@/lib/api/client';
import {
  getCommissionDeals,
  closeCommissionDeal,
  cancelCommissionDeal,
} from '@/lib/api/commission';
import { useToast } from '@/hooks/use-toast';
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
import { Loader2, Plus, Eye, Edit2, Trash2 } from 'lucide-react';

interface CommissionDeal {
  id: number;
  deal_id: string;
  commodity_name?: string;
  total_quantity_mt: number;
  quantity_lifted_mt: number;
  quantity_remaining_mt: number;
  seller_name?: string;
  principal_buyer_name?: string;
  commission_applicable: boolean;
  total_buyer_commission: number;
  total_seller_commission: number;
  commission_received: number;
  status: string;
}

const toNumber = (value: unknown, fallback = 0): number => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeDeal = (deal: any): CommissionDeal => ({
  ...deal,
  total_quantity_mt: toNumber(deal.total_quantity_mt),
  quantity_lifted_mt: toNumber(deal.quantity_lifted_mt),
  quantity_remaining_mt: toNumber(deal.quantity_remaining_mt),
  total_buyer_commission: toNumber(deal.total_buyer_commission),
  total_seller_commission: toNumber(deal.total_seller_commission),
  commission_received: toNumber(deal.commission_received),
});

export default function CommissionDealsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const hasAccess = useModuleAccess('commission');

  const [deals, setDeals] = useState<CommissionDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!hasAccess) {
      router.push('/dashboard');
      return;
    }
    fetchDeals(searchTerm, statusFilter);
  }, [isAuthenticated, hasAccess]);

  const fetchDeals = async (
    currentSearch = searchTerm,
    currentStatus = statusFilter
  ) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (currentSearch) params.append('search', currentSearch);
      if (currentStatus !== 'all') params.append('status', currentStatus);

      const response = await getCommissionDeals(params);
      const rawDeals = response.results || response || [];
      setDeals(rawDeals.map(normalizeDeal));
    } catch (error: any) {
      console.error('Failed to fetch deals:', error);
      toast?.error?.('Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDeal = (id: number) => {
    router.push(`/dashboard/commission/deals/${id}`);
  };

  const handleEditDeal = (id: number) => {
    router.push(`/dashboard/commission/deals/${id}/edit`);
  };

  const handleDeleteDeal = async (id: number) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    try {
      await apiClient.delete(`/commission/deals/${id}/`);
      fetchDeals(searchTerm, statusFilter);
    } catch (error) {
      console.error('Failed to delete deal:', error);
    }
  };

  const handleCloseDeal = async (id: number) => {
    if (!confirm('Close this deal? This will set status to closed.')) return;
    try {
      await closeCommissionDeal(id);
      toast?.success?.('Deal closed');
      fetchDeals(searchTerm, statusFilter);
    } catch (error: any) {
      toast?.error?.(error?.response?.data?.detail || 'Failed to close deal');
    }
  };

  const handleCancelDeal = async (id: number) => {
    if (!confirm('Cancel this deal? This action cannot be easily undone.')) return;
    try {
      await cancelCommissionDeal(id);
      toast?.success?.('Deal cancelled');
      fetchDeals(searchTerm, statusFilter);
    } catch (error: any) {
      toast?.error?.(error?.response?.data?.detail || 'Failed to cancel deal');
    }
  };

  const handleCreateNew = () => {
    router.push('/dashboard/commission/deals/new');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      partially_executed: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
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
          <h1 className="text-3xl font-bold">Commission Deals</h1>
          <p className="text-gray-500">Manage commission trading deals (Meals / Back-to-Back)</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Deal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deals</CardTitle>
          <CardDescription>Commission deals with lifting and settlement tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search by Deal ID or party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyUp={(e) => {
                const value = (e.target as HTMLInputElement).value;
                fetchDeals(value, statusFilter);
              }}
              className="flex-1"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                fetchDeals(searchTerm, value);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="partially_executed">Partially Executed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => fetchDeals(searchTerm, statusFilter)} variant="outline">
              Search
            </Button>
          </div>

          <div className="overflow-x-auto">
            {deals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg mb-2">No deals found</p>
                <p className="text-gray-400 text-sm">
                  Create your first commission deal to get started
                </p>
                <Button onClick={handleCreateNew} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  New Deal
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Principal Buyer</TableHead>
                    <TableHead className="text-right">Total (MT)</TableHead>
                    <TableHead className="text-right">Lifted (MT)</TableHead>
                    <TableHead className="text-right">Remaining (MT)</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.deal_id}</TableCell>
                      <TableCell>{deal.commodity_name || '-'}</TableCell>
                      <TableCell>{deal.seller_name || '-'}</TableCell>
                      <TableCell>{deal.principal_buyer_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        {toNumber(deal.total_quantity_mt).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {toNumber(deal.quantity_lifted_mt).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {toNumber(deal.quantity_remaining_mt).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(
                          toNumber(deal.total_buyer_commission) +
                          toNumber(deal.total_seller_commission)
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDeal(deal.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDeal(deal.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCloseDeal(deal.id)}
                            title="Close Deal"
                          >
                            Close
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelDeal(deal.id)}
                            title="Cancel Deal"
                            className="text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}