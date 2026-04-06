'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getDealBalanceReport,
  getBuyerCommissionStatement,
  getSellerCommissionStatement,
  getCommissionSummaryReport,
  getDailyDispatchReport
} from '@/lib/api/commission';

interface ReportFilters {
  fromDate: string;
  toDate: string;
  commodity: string;
  party: string;
  status: string;
}

export default function CommissionReportsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('deal-balance');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    fromDate: '',
    toDate: '',
    commodity: '',
    party: '',
    status: ''
  });

  const runReport = async (reportType: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.fromDate) params.set('from_date', filters.fromDate);
      if (filters.toDate) params.set('to_date', filters.toDate);
      if (filters.commodity) params.set('commodity', filters.commodity);
      if (filters.party) params.set('party', filters.party);
      if (filters.status) params.set('status', filters.status);

      let data;
      switch (reportType) {
        case 'deal-balance':
          data = await getDealBalanceReport(params);
          break;
        case 'buyer-commission':
          data = await getBuyerCommissionStatement(params);
          break;
        case 'seller-commission':
          data = await getSellerCommissionStatement(params);
          break;
        case 'commission-summary':
          data = await getCommissionSummaryReport(params);
          break;
        case 'daily-dispatch':
          data = await getDailyDispatchReport(params);
          break;
        default:
          throw new Error('Unknown report type');
      }

      setReportData(data);
      toast({
        title: 'Report Generated',
        description: 'Report data loaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `commission-report-${activeTab}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderDealBalanceReport = () => {
    if (!reportData?.details) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{reportData.total_deals}</div>
              <div className="text-sm text-muted-foreground">Total Deals</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">₹{reportData.total_commission?.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Commission</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">₹{reportData.commission_received?.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Commission Received</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">₹{reportData.outstanding_commission?.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Outstanding</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deal Balance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal ID</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-right">Lifted Qty</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.details.map((deal: any) => (
                  <TableRow key={deal.deal_id}>
                    <TableCell className="font-medium">{deal.deal_id}</TableCell>
                    <TableCell>{deal.commodity}</TableCell>
                    <TableCell>{deal.seller_name}</TableCell>
                    <TableCell>{deal.principal_buyer}</TableCell>
                    <TableCell className="text-right">{deal.total_quantity_mt}</TableCell>
                    <TableCell className="text-right">{deal.quantity_lifted_mt}</TableCell>
                    <TableCell className="text-right">{deal.quantity_remaining_mt}</TableCell>
                    <TableCell className="text-right">₹{deal.total_commission?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{deal.commission_received?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{deal.outstanding_commission?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={deal.status === 'open' ? 'default' : 'secondary'}>
                        {deal.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSellerCommissionStatement = () => {
    if (!reportData?.sellers) return null;

    return (
      <div className="space-y-4">
        {reportData.sellers.map((seller: any) => (
          <Card key={seller.seller_code}>
            <CardHeader>
              <CardTitle>{seller.seller_name} ({seller.seller_code})</CardTitle>
              <CardDescription>
                {seller.total_deals} deals • ₹{seller.total_commission?.toLocaleString()} total commission
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold">₹{seller.commission_received?.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Commission Received</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">₹{seller.outstanding?.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {seller.outstanding > 0 ? 'Pending' : 'Settled'}
                  </div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal ID</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seller.deals.map((deal: any) => (
                    <TableRow key={deal.deal_id}>
                      <TableCell>{deal.deal_id}</TableCell>
                      <TableCell>{deal.commodity}</TableCell>
                      <TableCell className="text-right">{deal.quantity}</TableCell>
                      <TableCell className="text-right">₹{deal.commission?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{deal.received?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{deal.outstanding?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderDailyDispatchReport = () => {
    if (!reportData?.details) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{reportData.total_liftings}</div>
              <div className="text-sm text-muted-foreground">Total Liftings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{reportData.total_quantity_mt}</div>
              <div className="text-sm text-muted-foreground">Total Quantity (MT)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">₹{reportData.total_buyer_commission?.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Buyer Commission</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">₹{reportData.total_seller_commission?.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Seller Commission</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Dispatch Details - {reportData.lifting_date}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lifting ID</TableHead>
                  <TableHead>Deal ID</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Buyer Comm</TableHead>
                  <TableHead className="text-right">Seller Comm</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.details.map((lifting: any) => (
                  <TableRow key={lifting.lifting_id}>
                    <TableCell>{lifting.lifting_id}</TableCell>
                    <TableCell>{lifting.deal_id}</TableCell>
                    <TableCell>{lifting.commodity}</TableCell>
                    <TableCell>{lifting.buyer}</TableCell>
                    <TableCell>{lifting.receiver}</TableCell>
                    <TableCell className="text-right">{lifting.quantity_mt}</TableCell>
                    <TableCell className="text-right">₹{lifting.buyer_commission?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{lifting.seller_commission?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={lifting.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {lifting.payment_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Commission Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive reporting for commission deals and settlements
          </p>
        </div>
        {reportData && (
          <Button onClick={exportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
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
                placeholder="Party name"
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="partially_executed">Partially Executed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="deal-balance">Deal Balance</TabsTrigger>
          <TabsTrigger value="buyer-commission">Buyer Commission</TabsTrigger>
          <TabsTrigger value="seller-commission">Seller Commission</TabsTrigger>
          <TabsTrigger value="commission-summary">Commission Summary</TabsTrigger>
          <TabsTrigger value="daily-dispatch">Daily Dispatch</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => runReport(activeTab)}
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>

        <TabsContent value="deal-balance" className="mt-6">
          {renderDealBalanceReport()}
        </TabsContent>

        <TabsContent value="buyer-commission" className="mt-6">
          {renderBuyerCommissionStatement()}
        </TabsContent>

        <TabsContent value="seller-commission" className="mt-6">
          {renderSellerCommissionStatement()}
        </TabsContent>

        <TabsContent value="commission-summary" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Commission Summary Report - Coming Soon</p>
          </div>
        </TabsContent>

        <TabsContent value="daily-dispatch" className="mt-6">
          {renderDailyDispatchReport()}
        </TabsContent>
      </Tabs>
    </div>
  );
}