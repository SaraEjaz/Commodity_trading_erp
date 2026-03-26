'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Calendar, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportsAPI } from '@/lib/api/reports';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('sales');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', dateRange, reportType],
    queryFn: () => reportsAPI.getReport(reportType, dateRange),
  });

  const { data: salesTrend } = useQuery({
    queryKey: ['sales-trend', dateRange],
    queryFn: () => reportsAPI.getSalesTrend(dateRange),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyze business performance and metrics</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full mt-2 px-4 py-2 border rounded-lg bg-background text-foreground"
          >
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="trading">Trading Report</option>
            <option value="financial">Financial Report</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full mt-2 px-4 py-2 border rounded-lg bg-background text-foreground"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button variant="outline" className="w-full">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground mt-2">${reportData?.totalRevenue?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-green-600 mt-2">+12.5% from last period</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold text-foreground mt-2">{reportData?.totalOrders || 0}</p>
          <p className="text-xs text-blue-600 mt-2">+8.2% from last period</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Avg Order Value</p>
          <p className="text-2xl font-bold text-foreground mt-2">${reportData?.avgOrderValue?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-green-600 mt-2">+3.1% from last period</p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Profit Margin</p>
          <p className="text-2xl font-bold text-foreground mt-2">{reportData?.profitMargin?.toFixed(2) || '0.00'}%</p>
          <p className="text-xs text-green-600 mt-2">+1.8% from last period</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-foreground">Sales by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData?.categoryData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Line Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <LineChartIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-foreground">Sales Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-foreground">Item</th>
                <th className="text-right py-3 px-4 font-medium text-foreground">Quantity</th>
                <th className="text-right py-3 px-4 font-medium text-foreground">Revenue</th>
                <th className="text-right py-3 px-4 font-medium text-foreground">Growth</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.details?.map((item, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 text-foreground">{item.name}</td>
                  <td className="text-right py-3 px-4 text-foreground">{item.quantity}</td>
                  <td className="text-right py-3 px-4 font-semibold text-foreground">${item.revenue?.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">
                    <span className={`text-sm font-medium ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.growth >= 0 ? '+' : ''}{item.growth?.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
