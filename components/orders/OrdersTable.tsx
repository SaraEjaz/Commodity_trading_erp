'use client';

import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OrdersTable({ orders, isLoading, onEdit }) {
  if (isLoading) return <Card className="p-8 text-center text-muted-foreground">Loading...</Card>;
  if (!orders.length) return <Card className="p-8 text-center text-muted-foreground">No orders found.</Card>;

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-4 px-6 font-semibold text-foreground">Order ID</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Type</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Quantity</th>
              <th className="text-right py-4 px-6 font-semibold text-foreground">Amount</th>
              <th className="text-center py-4 px-6 font-semibold text-foreground">Status</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
              <th className="text-center py-4 px-6 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-muted/50">
                <td className="py-4 px-6 font-medium text-foreground">#{order.id}</td>
                <td className="py-4 px-6 text-foreground text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${order.order_type === 'BUY' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {order.order_type}
                  </span>
                </td>
                <td className="py-4 px-6 text-right text-foreground">{order.quantity}</td>
                <td className="py-4 px-6 text-right font-semibold text-foreground">${order.total_amount?.toFixed(2)}</td>
                <td className="py-4 px-6 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(order)}>
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
