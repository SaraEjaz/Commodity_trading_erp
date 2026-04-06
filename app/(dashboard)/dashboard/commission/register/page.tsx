'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCommissionRegister, getCommissionCollections } from '@/lib/api/commission';

interface CommissionRegisterEntry {
  id: number;
  entry_date: string;
  deal_id: string;
  dispatch_id: string;
  commodity: string;
  buyer_code: string;
  buyer_name: string;
  seller_code: string;
  seller_name: string;
  quantity: number;
  buyer_commission: number;
  seller_commission: number;
  buyer_commission_status: 'pending' | 'received' | 'overdue';
  seller_commission_status: 'pending' | 'received' | 'overdue';
  buyer_payment_date?: string;
  seller_payment_date?: string;
  remarks: string;
}

interface CommissionCollection {
  id: number;
  collection_date: string;
  party_code: string;
  party_name: string;
  party_type: 'buyer' | 'seller';
  amount_collected: number;
  payment_mode: 'cash' | 'cheque' | 'bank_transfer' | 'rtgs' | 'neft';
  reference_number: string;
  bank_name: string;
  collected_by: string;
  remarks: string;
}

export default function CommissionRegisterPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('register');
  const [isLoading, setIsLoading] = useState(false);
  const [registerEntries, setRegisterEntries] = useState<CommissionRegisterEntry[]>([]);
  const [collections, setCollections] = useState<CommissionCollection[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    commodity: '',
    party: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'register') {
        const registerData = await getCommissionRegister();
        setRegisterEntries(registerData);
      } else if (activeTab === 'collections') {
        const collectionsData = await getCommissionCollections();
        setCollections(collectionsData);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    loadData();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge className="bg-green-100 text-green-800">Received</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateTotals = () => {
    const totals = {
      totalBuyerCommission: 0,
      totalSellerCommission: 0,
      receivedBuyerCommission: 0,
      receivedSellerCommission: 0,
      pendingBuyerCommission: 0,
      pendingSellerCommission: 0,
      overdueBuyerCommission: 0,
      overdueSellerCommission: 0
    };

    registerEntries.forEach(entry => {
      totals.totalBuyerCommission += entry.buyer_commission;
      totals.totalSellerCommission += entry.seller_commission;

      if (entry.buyer_commission_status === 'received') {
        totals.receivedBuyerCommission += entry.buyer_commission;
      } else if (entry.buyer_commission_status === 'pending') {
        totals.pendingBuyerCommission += entry.buyer_commission;
      } else if (entry.buyer_commission_status === 'overdue') {
        totals.overdueBuyerCommission += entry.buyer_commission;
      }

      if (entry.seller_commission_status === 'received') {
        totals.receivedSellerCommission += entry.seller_commission;
      } else if (entry.seller_commission_status === 'pending') {
        totals.pendingSellerCommission += entry.seller_commission;
      } else if (entry.seller_commission_status === 'overdue') {
        totals.overdueSellerCommission += entry.seller_commission;
      }
    });

    return totals;
  };

  const totals = calculateTotals();

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Commission Register</h1>
          <p className="text-muted-foreground">
            Track commission collections and settlements
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">₹{totals.totalBuyerCommission?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Buyer Commission</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">₹{totals.receivedBuyerCommission?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Buyer Commission Received</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">₹{totals.totalSellerCommission?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Seller Commission</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">₹{(totals.pendingBuyerCommission + totals.pendingSellerCommission)?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Pending Collection</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="commodity">Commodity</Label>
              <Input
                id="commodity"
                placeholder="Commodity name"
                value={filters.commodity}
                onChange={(e) => setFilters(prev => ({ ...prev, commodity: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="party">Party</Label>
              <Input
                id="party"
                placeholder="Party name/code"
                value={filters.party}
                onChange={(e) => setFilters(prev => ({ ...prev, party: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={applyFilters} disabled={isLoading}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">Commission Register</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="register" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Commission Register
              </CardTitle>
              <CardDescription>
                Detailed register of all commission entries and their collection status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Deal/Dispatch</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Buyer Comm</TableHead>
                    <TableHead>Buyer Status</TableHead>
                    <TableHead className="text-right">Seller Comm</TableHead>
                    <TableHead>Seller Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.deal_id}</div>
                          <div className="text-sm text-muted-foreground">{entry.dispatch_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{entry.commodity}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.buyer_code}</div>
                          <div className="text-sm text-muted-foreground">{entry.buyer_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.seller_code}</div>
                          <div className="text-sm text-muted-foreground">{entry.seller_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{entry.quantity}</TableCell>
                      <TableCell className="text-right">₹{entry.buyer_commission?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(entry.buyer_commission_status)}</TableCell>
                      <TableCell className="text-right">₹{entry.seller_commission?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(entry.seller_commission_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Commission Collections
              </CardTitle>
              <CardDescription>
                Record of all commission collections and payments received
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collections.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Collections Found</h3>
                  <p className="text-muted-foreground">
                    No commission collections have been recorded yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection Date</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead className="text-right">Amount Collected</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Collected By</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell>{new Date(collection.collection_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{collection.party_code}</div>
                            <div className="text-sm text-muted-foreground">{collection.party_name}</div>
                            <Badge variant="outline" className="text-xs">{collection.party_type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{collection.amount_collected?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{collection.payment_mode}</Badge>
                        </TableCell>
                        <TableCell>{collection.reference_number}</TableCell>
                        <TableCell>{collection.collected_by}</TableCell>
                        <TableCell className="max-w-xs truncate">{collection.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}