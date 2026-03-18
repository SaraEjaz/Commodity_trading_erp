'use client';

import React from 'react';
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function InventoryTable({ items, isLoading, onEdit }) {
  if (isLoading) return <Card className="p-8 text-center text-muted-foreground">Loading...</Card>;
  if (!items.length) return <Card className="p-8 text-center text-muted-foreground">No inventory items found.</Card>;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-4 px-6 font-semibold text-foreground">Commodity</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Warehouse</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Quantity</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Min Level</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Unit Price</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Total Value</th>
              <th className="text-center py-4 px-6 font-semibold text-foreground">Status</th>
              <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLowStock = item.quantity <= item.minimum_level;
              return (
                <tr key={item.id} className="border-b hover:bg-muted/50">
                  <td className="py-4 px-6 font-medium text-foreground">{item.commodity_name}</td>
                  <td className="py-4 px-6 text-foreground text-sm">{item.warehouse}</td>
                  <td className="py-4 px-6 text-right text-foreground">{item.quantity}</td>
                  <td className="py-4 px-6 text-right text-foreground">{item.minimum_level}</td>
                  <td className="py-4 px-6 text-right text-foreground">${item.unit_price?.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right font-semibold text-foreground">${(item.quantity * item.unit_price)?.toFixed(2)}</td>
                  <td className="py-4 px-6 text-center">
                    {isLowStock ? (
                      <div className="flex items-center justify-center gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium">Low Stock</span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
