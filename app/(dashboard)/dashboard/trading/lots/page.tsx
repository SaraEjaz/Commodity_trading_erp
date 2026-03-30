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
import { Loader2, Eye } from 'lucide-react';

interface Lot {
  id: number;
  lot_id: string;
  commodity_code: string;
  warehouse_name: string;
  supplier_name: string;
  inward_date: string;
  original_quantity_mt: number;
  balance_quantity_mt: number;
  status: string;
}

export default function LotsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const hasAccess = useModuleAccess('trading');

  const [lots, setLots] = useState<Lot[]>([]);
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

    fetchLots();
  }, [isAuthenticated, hasAccess]);

  const fetchLots = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await apiClient.get(`/trading/lots/?${params}`);
      setLots(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch lots:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewLot = (id: number) => {
    router.push(`/dashboard/trading/lots/${id}`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      partially_sold: 'bg-yellow-100 text-yellow-800',
      fully_sold: 'bg-gray-100 text-gray-800',
      obsolete: 'bg-red-100 text-red-800',
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
      <div>
        <h1 className="text-3xl font-bold">Inventory Lots</h1>
        <p className="text-gray-500">View warehouse inventory lots by batch</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lots</CardTitle>
          <CardDescription>Inventory lots with stock tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search by lot ID or commodity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={() => fetchLots()}
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="partially_sold">Partially Sold</SelectItem>
                  <SelectItem value="fully_sold">Fully Sold</SelectItem>
                  <SelectItem value="obsolete">Obsolete</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchLots} variant="outline">
                Search
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {lots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No lots found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot ID</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Inward Date</TableHead>
                    <TableHead className="text-right">Original (MT)</TableHead>
                    <TableHead className="text-right">Balance (MT)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.lot_id}</TableCell>
                      <TableCell>{lot.commodity_code}</TableCell>
                      <TableCell>{lot.warehouse_name}</TableCell>
                      <TableCell>{lot.supplier_name}</TableCell>
                      <TableCell>{new Date(lot.inward_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{lot.original_quantity_mt.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{lot.balance_quantity_mt.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(lot.status)}>
                          {lot.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewLot(lot.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
