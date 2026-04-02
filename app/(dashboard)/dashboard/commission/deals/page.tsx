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

export default function CommissionDealsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const hasAccess = useModuleAccess('commission');

  const [deals, setDeals] = useState<CommissionDeal[]>([]);
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
    fetchDeals();
  }, [isAuthenticated, hasAccess]);

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await apiClient.get(`/commission/deals/?${params}`);
      setDeals(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
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
      fetchDeals();
    } catch (error) {
      console.error('Failed to delete deal:', error);
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
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search by Deal ID or party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyUp={fetchDeals}
              className="flex-1"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                fetchDeals();
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
            <Button onClick={fetchDeals} variant="outline">
              Search
            </Button>
          </div>

          {/* Table */}
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
                        {deal.total_quantity_mt.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {deal.quantity_lifted_mt.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {deal.quantity_remaining_mt.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(
                          deal.total_buyer_commission + deal.total_seller_commission
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
