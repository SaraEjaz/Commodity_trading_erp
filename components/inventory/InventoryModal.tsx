'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function InventoryModal({ isOpen, onClose, item }) {
  const [formData, setFormData] = useState({
    commodity_id: '',
    warehouse: '',
    quantity: 0,
    minimum_level: 0,
    maximum_level: 0,
    unit_price: 0,
    location: '',
  });

  useEffect(() => {
    if (item) setFormData(item);
  }, [item, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background">
          <h2 className="text-xl font-bold text-foreground">{item ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Warehouse</label>
            <Input value={formData.warehouse} onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Quantity</label>
            <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Minimum Level</label>
            <Input type="number" value={formData.minimum_level} onChange={(e) => setFormData({ ...formData, minimum_level: parseInt(e.target.value) })} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Maximum Level</label>
            <Input type="number" value={formData.maximum_level} onChange={(e) => setFormData({ ...formData, maximum_level: parseInt(e.target.value) })} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Unit Price</label>
            <Input type="number" step="0.01" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })} className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Location</label>
            <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="mt-1" placeholder="e.g., Shelf A1" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">{item ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
