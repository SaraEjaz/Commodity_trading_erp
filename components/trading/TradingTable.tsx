'use client';

import React from 'react';
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TradingTable({ trades, isLoading, onEdit }) {
  if (isLoading) return <Card className="p-8 text-center text-muted-foreground">Loading...</Card>;
  if (!trades.length) return <Card className="p-8 text-center text-muted-foreground">No trades found.</Card>;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-4 px-6 font-semibold text-foreground">Commodity</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Qty</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Entry Price</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Current Price</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">P/L</th>
              <th className="text-center py-4 px-6 font-semibold text-foreground">Status</th>
              <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b hover:bg-muted/50">
                <td className="py-4 px-6 font-medium text-foreground">{trade.commodity_name}</td>
                <td className="py-4 px-6 text-right text-foreground">{trade.quantity}</td>
                <td className="py-4 px-6 text-right text-foreground">${trade.entry_price?.toFixed(2)}</td>
                <td className="py-4 px-6 text-right text-foreground">${trade.current_price?.toFixed(2)}</td>
                <td className={`py-4 px-6 text-right font-semibold flex items-center justify-end gap-1 ${trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trade.profit_loss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  ${trade.profit_loss?.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${trade.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {trade.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(trade)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
