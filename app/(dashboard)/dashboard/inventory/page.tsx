'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import InventoryTable from '@/components/inventory/InventoryTable';
import InventoryModal from '@/components/inventory/InventoryModal';
import { inventoryAPI } from '@/lib/api/inventory';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { data: inventory = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory', searchTerm],
    queryFn: () => inventoryAPI.list({ search: searchTerm }),
  });

  const stats = {
    totalItems: inventory.length,
    lowStockItems: inventory.filter(i => i.quantity <= i.minimum_level).length,
    totalValue: inventory.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0),
    averageValue: inventory.length > 0 ? (inventory.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0) / inventory.length) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor stock levels and warehouse operations</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-foreground">{stats.lowStockItems}</p>
            </div>
            <div className={`p-3 rounded-lg ${stats.lowStockItems > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <AlertTriangle className={`w-6 h-6 ${stats.lowStockItems > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-foreground">${stats.totalValue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Item Value</p>
              <p className="text-2xl font-bold text-foreground">${stats.averageValue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search inventory items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <InventoryTable 
        items={inventory} 
        isLoading={isLoading}
        onEdit={(item) => {
          setSelectedItem(item);
          setIsModalOpen(true);
        }}
      />

      {/* Modal */}
      <InventoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          refetch();
        }}
        item={selectedItem}
      />
    </div>
  );
}
