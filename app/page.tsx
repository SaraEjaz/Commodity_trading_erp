'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Link from 'next/link';
import { ArrowRight, BarChart3, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const { is_authenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (is_authenticated) {
      router.push('/dashboard');
    }
  }, [is_authenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Commodity ERP</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Professional Commodity Trading Platform
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Complete ERP system for trading, inventory management, orders, and financial settlements. 
          Built for commodity traders and logistics professionals.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="gap-2">
              Sign In <ArrowRight size={20} />
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features for Modern Trading
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Trading Engine',
                description: 'Real-time trade execution with position tracking and P&L calculations',
              },
              {
                icon: ShoppingCart,
                title: 'Order Management',
                description: 'Complete procurement and sales order lifecycle management',
              },
              {
                icon: Package,
                title: 'Inventory Tracking',
                description: 'Multi-warehouse inventory with real-time stock levels',
              },
              {
                icon: BarChart3,
                title: 'Advanced Reports',
                description: 'Comprehensive analytics and financial reporting tools',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-6 rounded-lg bg-gray-50 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon size={24} className="text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">50K+</p>
              <p className="text-gray-600">Daily Transactions</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">$2.5B+</p>
              <p className="text-gray-600">Total Trading Volume</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">500+</p>
              <p className="text-gray-600">Active Traders</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Trading?</h3>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of traders using our platform for seamless commodity trading.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Trading</a></li>
                <li><a href="#" className="hover:text-white transition">Orders</a></li>
                <li><a href="#" className="hover:text-white transition">Inventory</a></li>
                <li><a href="#" className="hover:text-white transition">Reports</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Compliance</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex items-center justify-between text-sm">
            <p>&copy; 2024 Commodity ERP. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">LinkedIn</a>
              <a href="#" className="hover:text-white transition">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
