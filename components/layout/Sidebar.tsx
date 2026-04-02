'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { toggleSidebar } from '@/lib/slices/uiSlice';
import { logout } from '@/lib/slices/authSlice';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  Handshake,
  Warehouse,
  BookOpen,
  LogOut,
  ChevronRight,
  DollarSign,
  ClipboardList,
} from 'lucide-react';

const ALL_MENU_ITEMS = [
  // Always visible
  { module: null, icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },

  // COMMISSION MODULE (Meals)
  { module: 'commission', section: 'Commission (Meals)', icon: Handshake, label: 'Commission Deals', href: '/dashboard/commission' },
  { module: 'commission', icon: ClipboardList, label: 'Liftings', href: '/dashboard/commission/liftings' },
  { module: 'commission', icon: DollarSign, label: 'Commission Reports', href: '/dashboard/commission/reports' },

  // TRADING MODULE (Pulses)
  { module: 'trading', section: 'Trading (Pulses)', icon: TrendingUp, label: 'Trading', href: '/dashboard/trading' },
  { module: 'trading', icon: Warehouse, label: 'Lots & Purchases', href: '/dashboard/trading/lots' },
  { module: 'trading', icon: ShoppingCart, label: 'Sales', href: '/dashboard/trading/sales' },

  // SHARED
  { module: 'inventory', section: 'Shared', icon: Package, label: 'Inventory', href: '/dashboard/inventory' },
  { module: 'orders', icon: ShoppingCart, label: 'Orders', href: '/dashboard/orders' },
  { module: 'reports', icon: BarChart3, label: 'Reports', href: '/dashboard/reports' },
  { module: 'masters', icon: BookOpen, label: 'Masters', href: '/dashboard/masters' },

  // Always visible
  { module: null, icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const allowedModules: string[] = user?.allowed_modules ?? [];

  const visibleItems = ALL_MENU_ITEMS.filter((item) => {
    if (item.module === null) return true;
    return allowedModules.includes(item.module);
  });

  const getSidebarTitle = () => {
    const hasCommission = allowedModules.includes('commission');
    const hasTrading = allowedModules.includes('trading');
    if (hasCommission && hasTrading) return 'Commodity ERP';
    if (hasCommission) return 'Commission ERP';
    if (hasTrading) return 'Trading ERP';
    return 'Commodity ERP';
  };

  const shownSections = new Set<string>();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <>
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-300 w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col fixed md:relative h-full z-40`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-blue-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-400 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            {getSidebarTitle()}
          </h1>
          {user && (
            <p className="text-blue-200 text-xs mt-2 truncate">
              {user.first_name} {user.last_name}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

            const sectionLabel = 'section' in item ? item.section : undefined;
            let showSection = false;
            if (sectionLabel && !shownSections.has(sectionLabel)) {
              shownSections.add(sectionLabel);
              showSection = true;
            }

            return (
              <React.Fragment key={item.href}>
                {showSection && sectionLabel && (
                  <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider pt-4 pb-1 px-2">
                    {sectionLabel}
                  </p>
                )}
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-500 text-white' : 'text-blue-100 hover:bg-blue-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={16} />}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-blue-700 space-y-3">
          {user && (
            <div className="px-2">
              <p className="text-blue-200 text-xs">Logged in as</p>
              <p className="text-white text-sm font-medium truncate">{user.email}</p>
              <p className="text-blue-300 text-xs capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}
    </>
  );
}
