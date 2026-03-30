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

interface Purchase {
  id: number;
  purchase_id: string;
  purchase_date: string;
  supplier_name: string;
  commodity_code: string;
  quantity_mt: number;
  rate_per_mt: number;
  total_value: number;
  status: string;
}

export default function PurchasesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const hasAccess = useModuleAccess('trading');

  const [purchases, setPurchases] = useState<Purchase[]>([]);
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

    fetchPurchases();
  }, [isAuthenticated, hasAccess]);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await apiClient.get(`/trading/purchases/?${params}`);
      setPurchases(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPurchase = (id: number) => {
    router.push(`/dashboard/trading/purchases/${id}`);
  };

  const handleEditPurchase = (id: number) => {
    router.push(`/dashboard/trading/purchases/${id}/edit`);
  };

  const handleDeletePurchase = async (id: number) => {
    if (!confirm('Are you sure you want to delete this purchase?')) {
      return;
    }

    try {
      await apiClient.delete(`/trading/purchases/${id}/`);
      fetchPurchases();
    } catch (error) {
      console.error('Failed to delete purchase:', error);
    }
  };

  const handleCreateNew = () => {
    router.push('/dashboard/trading/purchases/new');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      received: 'bg-green-100 text-green-800',
      invoiced: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchases</h1>
          <p className="text-gray-500">Manage warehouse inventory purchases</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Purchase
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>List of all warehouse purchases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search by ID or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={() => fetchPurchases()}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchPurchases} variant="outline">
                Search
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {purchases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No purchases found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Quantity (MT)</TableHead>
                    <TableHead className="text-right">Rate/MT</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.purchase_id}</TableCell>
                      <TableCell>{new Date(purchase.purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell>{purchase.supplier_name}</TableCell>
                      <TableCell>{purchase.commodity_code}</TableCell>
                      <TableCell className="text-right">{purchase.quantity_mt.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{purchase.rate_per_mt.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{purchase.total_value.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(purchase.status)}>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewPurchase(purchase.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditPurchase(purchase.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePurchase(purchase.id)}
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
