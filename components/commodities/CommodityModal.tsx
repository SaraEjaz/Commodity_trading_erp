'use client';

import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { commoditiesAPI } from '@/lib/api/commodities';
import { toast } from 'sonner';

interface CommodityModalProps {
  isOpen: boolean;
  onClose: () => void;
  commodity?: any;
}

export default function CommodityModal({ isOpen, onClose, commodity }: CommodityModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    category: '',
    unit: '',
    current_price: 0,
    description: '',
  });

  useEffect(() => {
    if (commodity) {
      setFormData(commodity);
    } else {
      setFormData({
        name: '',
        symbol: '',
        category: '',
        unit: '',
        current_price: 0,
        description: '',
      });
    }
  }, [commodity, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data) => commoditiesAPI.create(data),
    onSuccess: () => {
      toast.success('Commodity created successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to create commodity');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => commoditiesAPI.update(commodity.id, data),
    onSuccess: () => {
      toast.success('Commodity updated successfully');
      onClose();
    },
    onError: () => {
      toast.error('Failed to update commodity');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commodity) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {commodity ? 'Edit Commodity' : 'Create Commodity'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Symbol</label>
            <Input
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-foreground"
              required
            >
              <option value="">Select category</option>
              <option value="Energy">Energy</option>
              <option value="Metals">Metals</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Softs">Softs</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Unit</label>
            <Input
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="mt-1"
              placeholder="e.g., Barrel, Ton, Bushel"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Current Price</label>
            <Input
              type="number"
              step="0.01"
              value={formData.current_price}
              onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) })}
              className="mt-1"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {commodity ? 'Update' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
