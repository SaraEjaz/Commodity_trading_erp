'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CommodityTable from '@/components/commodities/CommodityTable';
import CommodityModal from '@/components/commodities/CommodityModal';
import { commoditiesAPI } from '@/lib/api/commodities';

export default function CommoditiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState(null);

  const { data: commodities = [], isLoading, refetch } = useQuery({
    queryKey: ['commodities', searchTerm],
    queryFn: () => commoditiesAPI.list({ search: searchTerm }),
  });

  const handleAddCommodity = () => {
    setSelectedCommodity(null);
    setIsModalOpen(true);
  };

  const handleEditCommodity = (commodity) => {
    setSelectedCommodity(commodity);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCommodity(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Commodities</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage commodity listings and prices</p>
        </div>
        <Button onClick={handleAddCommodity} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Commodity
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search commodities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon">
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <CommodityTable 
        commodities={commodities} 
        isLoading={isLoading}
        onEdit={handleEditCommodity}
      />

      {/* Modal */}
      <CommodityModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        commodity={selectedCommodity}
      />
    </div>
  );
}
