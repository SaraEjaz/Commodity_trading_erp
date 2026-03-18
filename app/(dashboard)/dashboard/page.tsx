'use client';

import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data
const chartData = [
  { date: 'Jan', trading: 4000, inventory: 2400 },
  { date: 'Feb', trading: 3000, inventory: 1398 },
  { date: 'Mar', trading: 2000, inventory: 9800 },
  { date: 'Apr', trading: 2780, inventory: 3908 },
  { date: 'May', trading: 1890, inventory: 4800 },
];

const orderData = [
  { name: 'Completed', value: 65, fill: '#10b981' },
  { name: 'Pending', value: 25, fill: '#f59e0b' },
  { name: 'Failed', value: 10, fill: '#ef4444' },
];

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(card => card !== null);
    if (cards.length > 0) {
      cards.forEach((card, index) => {
        if (card) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
        }
      });
      // Stagger animation for cards
      cards.forEach((card, index) => {
        setTimeout(() => {
          if (card) {
            card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }
        }, index * 100);
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.first_name || 'User'}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card ref={(el) => { cardsRef.current[0] = el; }} className="p-6 bg-white hover:shadow-lg transition-shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Total Trades</h3>
            <p className="text-3xl font-bold text-blue-600">1,245</p>
            <p className="text-green-600 text-sm mt-2">+12% from last month</p>
          </Card>

          <Card ref={(el) => { cardsRef.current[1] = el; }} className="p-6 bg-white hover:shadow-lg transition-shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Active Orders</h3>
            <p className="text-3xl font-bold text-indigo-600">842</p>
            <p className="text-green-600 text-sm mt-2">+8% from last month</p>
          </Card>

          <Card ref={(el) => { cardsRef.current[2] = el; }} className="p-6 bg-white hover:shadow-lg transition-shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Inventory Value</h3>
            <p className="text-3xl font-bold text-purple-600">$2.4M</p>
            <p className="text-red-600 text-sm mt-2">-3% from last month</p>
          </Card>

          <Card className="p-6 bg-white hover:shadow-lg transition-shadow">
            <h3 className="text-gray-600 text-sm font-medium mb-2">Profit Margin</h3>
            <p className="text-3xl font-bold text-green-600">18.5%</p>
            <p className="text-green-600 text-sm mt-2">+2.1% from last month</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trading vs Inventory Chart */}
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTrading" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInventory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="trading" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTrading)" />
                <Area type="monotone" dataKey="inventory" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorInventory)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Order Status */}
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="space-y-4">
              {orderData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Trade Executed', description: 'Buy 500 MT Copper', time: '2 hours ago', status: 'completed' },
              { action: 'Order Created', description: 'PO-2024-001 for Steel', time: '4 hours ago', status: 'pending' },
              { action: 'Stock Adjusted', description: 'Inventory count adjustment', time: '1 day ago', status: 'completed' },
              { action: 'Settlement Processed', description: 'Payment received', time: '2 days ago', status: 'completed' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                <div>
                  <p className="font-semibold text-gray-900">{item.action}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
