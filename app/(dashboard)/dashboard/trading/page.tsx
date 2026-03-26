'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import TradingTable from '@/components/trading/TradingTable';
import TradingModal from '@/components/trading/TradingModal';
import { tradingAPI } from '@/lib/api/trading'; // ✅ Named export now works

export default function TradingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  const { data: trades = [], isLoading, refetch } = useQuery({
    queryKey: ['trades', searchTerm],
    // ✅ tradingAPI.list() now exists and unwraps paginated response
    queryFn: () => tradingAPI.list({ search: searchTerm }),
  });

  const stats = {
    totalTrades: trades.length,
    activePositions: trades.filter((t: any) => t.status === 'active').length,
    totalVolume: trades.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0),
    profitLoss: trades.reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trading</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage trading positions</p>
        </div>
        <Button onClick={() => { setSelectedTrade(null); setIsModalOpen(true); }} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          New Trade
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalTrades}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Positions</p>
              <p className="text-2xl font-bold text-foreground">{stats.activePositions}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><TrendingUp className="w-6 h-6 text-green-600" /></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalVolume.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg"><TrendingUp className="w-6 h-6 text-purple-600" /></div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Profit/Loss</p>
              <p className={`text-2xl font-bold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.profitLoss.toFixed(2)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${stats.profitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {stats.profitLoss >= 0
                ? <TrendingUp className="w-6 h-6 text-green-600" />
                : <TrendingDown className="w-6 h-6 text-red-600" />}
            </div>
          </div>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search trades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <TradingTable
        trades={trades}
        isLoading={isLoading}
        onEdit={(trade) => { setSelectedTrade(trade); setIsModalOpen(true); }}
      />

      <TradingModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTrade(null); refetch(); }}
        trade={selectedTrade}
      />
    </div>
  );
}