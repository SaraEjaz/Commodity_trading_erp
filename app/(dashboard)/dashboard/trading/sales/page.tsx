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

interface Sale {
  id: number;
  sale_id: string;
  sale_date: string;
  buyer_name: string;
  commodity_code: string;
  total_quantity_mt: number;
  sale_rate_per_mt: number;
  total_revenue: number;
  gross_profit: number;
  status: string;
}

export default function SalesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const hasAccess = useModuleAccess('trading');

  const [sales, setSales] = useState<Sale[]>([]);
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

    fetchSales();
  }, [isAuthenticated, hasAccess]);

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await apiClient.get(`/trading/sales/?${params}`);
      setSales(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSale = (id: number) => {
    router.push(`/dashboard/trading/sales/${id}`);
  };

  const handleEditSale = (id: number) => {
    router.push(`/dashboard/trading/sales/${id}/edit`);
  };

  const handleDeleteSale = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sale?')) {
      return;
    }

    try {
      await apiClient.delete(`/trading/sales/${id}/`);
      fetchSales();
    } catch (error) {
      console.error('Failed to delete sale:', error);
    }
  };

  const handleCreateNew = () => {
    router.push('/dashboard/trading/sales/new');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
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
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-gray-500">Manage warehouse inventory sales</p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Orders</CardTitle>
          <CardDescription>List of all warehouse sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search by ID or buyer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={() => fetchSales()}
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
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchSales} variant="outline">
                Search
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {sales.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No sales found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Quantity (MT)</TableHead>
                    <TableHead className="text-right">Rate/MT</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.sale_id}</TableCell>
                      <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.buyer_name}</TableCell>
                      <TableCell>{sale.commodity_code}</TableCell>
                      <TableCell className="text-right">{sale.total_quantity_mt.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{sale.sale_rate_per_mt.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{sale.total_revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span className={sale.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {sale.gross_profit.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(sale.status)}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewSale(sale.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSale(sale.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteSale(sale.id)}
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
