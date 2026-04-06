'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import apiClient from '@/lib/api/client';
import {
  getCommissionDashboardSummary,
  getRecentDispatches,
  getOpenDeals,
} from '@/lib/api/commission';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Package, Truck, DollarSign } from 'lucide-react';

interface DashboardSummary {
  deals_in_progress_count: number;
  quantity_pending_mt: number;
  recent_dispatches_count: number;
  commission_earned_total: number;
  commission_received_total: number;
  commission_pending_total: number;
  unpaid_shipments_count: number;
  third_party_recoverable_total: number;
  cpr_total: number;
}

export default function CommissionDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const hasAccess = useModuleAccess('commission');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentDispatches, setRecentDispatches] = useState<any[]>([]);
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!hasAccess) {
      router.push('/dashboard');
      return;
    }
    fetchDashboardSummary();
  }, [isAuthenticated, hasAccess]);

  const fetchDashboardSummary = async () => {
    try {
      setIsLoading(true);
      const data = await getCommissionDashboardSummary();
      setSummary(data);
      // load recent items
      fetchRecentData();
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
      // Set default values if API fails
      setSummary({
        deals_in_progress_count: 0,
        quantity_pending_mt: 0,
        recent_dispatches_count: 0,
        commission_earned_total: 0,
        commission_received_total: 0,
        commission_pending_total: 0,
        unpaid_shipments_count: 0,
        third_party_recoverable_total: 0,
        cpr_total: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentData = async () => {
    try {
      const [dispatches, openDeals] = await Promise.all([getRecentDispatches(6), getOpenDeals()]);
      setRecentDispatches(dispatches || []);
      setPendingDeals(openDeals || []);
    } catch (err) {
      console.error('Failed to load recent data', err);
    }
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
      <div>
        <h1 className="text-3xl font-bold">Commission Dashboard</h1>
        <p className="text-gray-500">
          Overview of commission deals, liftings, collections, and outstanding balances
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Deals</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.deals_in_progress_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active commission deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantity Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.quantity_pending_mt?.toFixed(2) || '0.00'} MT</div>
            <p className="text-xs text-muted-foreground">
              Remaining to dispatch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{summary?.commission_pending_total?.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">
              Outstanding commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Dispatches</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.recent_dispatches_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commission Summary</CardTitle>
            <CardDescription>Earned vs Received</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Total Earned:</span>
              <span className="font-semibold">₹{summary?.commission_earned_total?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Received:</span>
              <span className="font-semibold text-green-600">₹{summary?.commission_received_total?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Outstanding:</span>
              <span className="font-semibold text-red-600">₹{summary?.commission_pending_total?.toLocaleString() || '0'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/commission/deals/new')}
            >
              <Package className="mr-2 h-4 w-4" />
              Create New Deal
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/commission/dispatches/new')}
            >
              <Truck className="mr-2 h-4 w-4" />
              Record Dispatch
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push('/dashboard/commission/deals')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View All Deals
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Dispatches</CardTitle>
            <CardDescription>Latest liftings</CardDescription>
          </CardHeader>
          <CardContent>
            {recentDispatches.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent dispatches</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Dispatch ID</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Qty (MT)</th>
                      <th className="p-2 text-left">Buyer</th>
                      <th className="p-2 text-left">Invoice Party</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDispatches.map((d: any) => (
                      <tr key={d.id}>
                        <td className="p-2">{d.lifting_id || d.liftingId || '-'}</td>
                        <td className="p-2">{d.lifting_date || '-'}</td>
                        <td className="p-2 text-right">{d.quantity_mt}</td>
                        <td className="p-2">{d.principal_buyer_name || '-'}</td>
                        <td className="p-2">{d.invoice_party_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Deals</CardTitle>
            <CardDescription>Deals in progress</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingDeals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No open deals</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Deal ID</th>
                      <th className="p-2 text-left">Commodity</th>
                      <th className="p-2 text-right">Total MT</th>
                      <th className="p-2 text-right">Lifted</th>
                      <th className="p-2 text-left">Buyer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeals.map((d: any) => (
                      <tr key={d.id}>
                        <td className="p-2">{d.deal_id}</td>
                        <td className="p-2">{d.commodity_name || '-'}</td>
                        <td className="p-2 text-right">{d.total_quantity_mt}</td>
                        <td className="p-2 text-right">{d.quantity_lifted_mt}</td>
                        <td className="p-2">{d.principal_buyer_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
