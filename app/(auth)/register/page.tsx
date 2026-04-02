'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, Handshake, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import authAPI from '@/lib/api/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<'trading' | 'commission' | ''>('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) {
      toast.error('Please select a module (Trading or Commission)');
      return;
    }
    if (formData.password !== formData.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        module: selectedModule, // send selected module to backend
      });
      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch (error) {
      const message =
        (error as any)?.response?.data?.detail ||
        (error as any)?.response?.data?.email?.[0] ||
        'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Commodity ERP</h1>
          </div>
          <p className="text-gray-600">Create your account</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Module Selection — REQUIRED */}
            <div>
              <Label className="text-gray-700 font-semibold mb-3 block">
                Select Your Module <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Trading */}
                <button
                  type="button"
                  onClick={() => setSelectedModule('trading')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedModule === 'trading'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  {selectedModule === 'trading' && (
                    <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-blue-500" />
                  )}
                  <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="font-semibold text-gray-900 text-sm">Trading</p>
                  <p className="text-xs text-gray-500 mt-1">Pulses / Warehouse Inventory</p>
                </button>

                {/* Commission */}
                <button
                  type="button"
                  onClick={() => setSelectedModule('commission')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    selectedModule === 'commission'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  {selectedModule === 'commission' && (
                    <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500" />
                  )}
                  <Handshake className="w-8 h-8 text-green-600 mb-2" />
                  <p className="font-semibold text-gray-900 text-sm">Commission</p>
                  <p className="text-xs text-gray-500 mt-1">Meals / Back-to-Back Deals</p>
                </button>
              </div>
              {!selectedModule && (
                <p className="text-xs text-gray-400 mt-2">
                  Choose the module you will work in. This determines your dashboard access.
                </p>
              )}
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name" name="first_name" type="text" placeholder="John"
                  value={formData.first_name} onChange={handleChange} required disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name" name="last_name" type="text" placeholder="Doe"
                  value={formData.last_name} onChange={handleChange} required disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email" name="email" type="email" placeholder="john@example.com"
                value={formData.email} onChange={handleChange} required disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" name="password" type="password" placeholder="Min 8 characters"
                value={formData.password} onChange={handleChange} required disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password_confirm">Confirm Password</Label>
              <Input
                id="password_confirm" name="password_confirm" type="password" placeholder="••••••••"
                value={formData.password_confirm} onChange={handleChange} required disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className={`w-full ${
                selectedModule === 'commission'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              disabled={loading || !selectedModule}
            >
              {loading
                ? 'Creating Account...'
                : selectedModule
                ? `Register for ${selectedModule === 'trading' ? 'Trading' : 'Commission'} Module`
                : 'Select a Module to Continue'}
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}