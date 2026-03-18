'use client';

import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Commodity {
  id: number;
  name: string;
  symbol: string;
  category: string;
  unit: string;
  current_price: number;
  created_at: string;
}

interface CommodityTableProps {
  commodities: Commodity[];
  isLoading: boolean;
  onEdit: (commodity: Commodity) => void;
}

export default function CommodityTable({ commodities, isLoading, onEdit }: CommodityTableProps) {
  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Loading commodities...</p>
      </Card>
    );
  }

  if (commodities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No commodities found. Create one to get started.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-4 px-6 font-semibold text-foreground">Name</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Symbol</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Category</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Unit</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Price</th>
              <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {commodities.map((commodity) => (
              <tr key={commodity.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-4 px-6 font-medium text-foreground">{commodity.name}</td>
                <td className="py-4 px-6 text-foreground">
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                    {commodity.symbol}
                  </span>
                </td>
                <td className="py-4 px-6 text-foreground text-sm">{commodity.category}</td>
                <td className="py-4 px-6 text-foreground text-sm">{commodity.unit}</td>
                <td className="py-4 px-6 font-semibold text-right text-foreground">
                  ${commodity.current_price.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(commodity)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
