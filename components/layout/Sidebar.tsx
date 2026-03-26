'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { toggleSidebar } from '@/lib/slices/uiSlice';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: TrendingUp, label: 'Trading', href: '/dashboard/trading' },
  { icon: ShoppingCart, label: 'Orders', href: '/dashboard/orders' },
  { icon: Package, label: 'Inventory', href: '/dashboard/inventory' },
  { icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            ERP
          </h1>
          <p className="text-blue-200 text-sm mt-1">Commodity Trading</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-400 text-white'
                    : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-700">
          <p className="text-blue-200 text-xs text-center">
            © 2024 Commodity ERP<br />
            Professional Trading Platform
          </p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}
    </>
  );
}
