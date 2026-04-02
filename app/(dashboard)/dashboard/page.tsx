'use client';

import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import tradingAPI from '@/lib/api/trading';
import ordersAPI from '@/lib/api/orders';
import { inventoryAPI } from '@/lib/api/inventory';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch Data
  const { data: trades = [], isLoading: isLoadingTrades } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
    const result = await tradingAPI.getTrades();
    return Array.isArray(result) ? result : (result?.results || []);
    },
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
    const result = await ordersAPI.getOrders();
    return Array.isArray(result) ? result : (result?.results || []);
    },
  });

  // ✅ Unwrap the paginated response
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
    const result = await inventoryAPI.list();
    return Array.isArray(result) ? result : (result?.results || []);
    },
  });

  useEffect(() => {
    const cards = cardsRef.current.filter(card => card !== null);
    if (cards.length > 0) {
      cards.forEach((card) => {
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
        }
      });
      // Stagger animation for cards
      cards.forEach((card, index) => {
        setTimeout(() => {
          if (card) {
            card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }
        }, index * 100);
      });
    }
  }, [isLoadingTrades, isLoadingOrders, isLoadingInventory]);

  const stats = {
    totalTrades: trades.length,
    activeOrders: orders.filter((o: any) => o.status === 'pending' || o.status === 'confirmed').length,
    inventoryCount: inventory.length,
    totalInventoryValue: inventory.reduce((sum: number, item: any) => sum + (Number(item.quantity_on_hand || 0) * Number(item.unit_price || 0)), 0),
  };

  if (isLoadingTrades || isLoadingOrders || isLoadingInventory) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.first_name || 'User'}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card ref={(el) => { cardsRef.current[0] = el; }} className="p-6 bg-white hover:shadow-xl transition-all border-l-4 border-blue-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2 uppercase tracking-wider">Total Trades</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTrades}</p>
            <p className="text-blue-600 text-xs mt-2 font-medium">Live from Pulses flow</p>
          </Card>

          <Card ref={(el) => { cardsRef.current[1] = el; }} className="p-6 bg-white hover:shadow-xl transition-all border-l-4 border-indigo-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2 uppercase tracking-wider">Active Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
            <p className="text-indigo-600 text-xs mt-2 font-medium">Updated in real-time</p>
          </Card>

          <Card ref={(el) => { cardsRef.current[2] = el; }} className="p-6 bg-white hover:shadow-xl transition-all border-l-4 border-purple-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2 uppercase tracking-wider">Inventory Items</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.inventoryCount}</p>
            <p className="text-purple-600 text-xs mt-2 font-medium">Stock tracking active</p>
          </Card>

          <Card ref={(el) => { cardsRef.current[3] = el; }} className="p-6 bg-white hover:shadow-xl transition-all border-l-4 border-green-600">
            <h3 className="text-gray-600 text-sm font-medium mb-2 uppercase tracking-wider">Inventory Value</h3>
            <p className="text-3xl font-bold text-gray-900">${stats.totalInventoryValue.toLocaleString()}</p>
            <p className="text-green-600 text-xs mt-2 font-medium">Weighted avg valuation</p>
          </Card>
        </div>

        {/* Activity Chart */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Activity Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trades.slice(0, 7).reverse().map((t, i) => ({ name: `T-${i}`, value: t.total_value }))}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Trades</h3>
          <div className="space-y-4">
            {trades.slice(0, 5).map((trade, index) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                <div>
                  <p className="font-semibold text-gray-900">{trade.trade_type.toUpperCase()} - {trade.trade_id}</p>
                  <p className="text-sm text-gray-600">{trade.quantity} units @ ${trade.unit_price}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    trade.status === 'executed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {trade.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{trade.trade_date}</p>
                </div>
              </div>
            ))}
            {trades.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent trades found.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}