'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OrderModal({ isOpen, onClose, order }) {
  const [formData, setFormData] = useState({
    commodity_id: '',
    quantity: 0,
    unit_price: 0,
    order_type: 'BUY',
    supplier_id: '',
  });

  useEffect(() => {
    if (order) setFormData(order);
  }, [order, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{order ? 'Edit Order' : 'Create Order'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Order Type</label>
            <select value={formData.order_type} onChange={(e) => setFormData({ ...formData, order_type: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-foreground">
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Quantity</label>
            <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Unit Price</label>
            <Input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })} className="mt-1" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">{order ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
