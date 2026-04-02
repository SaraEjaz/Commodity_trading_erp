'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { setTokens, setError } from '@/lib/slices/authSlice';
import authAPI, { LoginCredentials } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(data as LoginCredentials);
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);

      dispatch(setTokens({
        access: response.access,
        refresh: response.refresh,
        user: response.user,
      }));

      toast.success('Login successful!');

      // Redirect based on allowed modules
      const allowedModules = response.user.allowed_modules ?? [];
      const defaultModule = response.user.default_module;

      if (defaultModule && defaultModule !== 'admin') {
        router.push(`/dashboard/${defaultModule}`);
      } else if (allowedModules.includes('trading')) {
        router.push('/dashboard/trading');
      } else if (allowedModules.includes('commission')) {
        // Commission users go to /dashboard/commission
        router.push('/dashboard/commission');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(message);
      dispatch(setError(message));
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill for demo credentials
  const fillCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Commodity Trading ERP</h1>
            <p className="text-gray-600">Professional Trading Platform</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className="w-full"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full"
                disabled={isLoading}
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline font-semibold">
              Register here
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-6 space-y-3">
            {/* Admin / Trading */}
            <div
              className="p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200"
              onClick={() => fillCredentials('admin1@admin.com', 'admin123')}
            >
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                🏭 Trading Module (Pulses)
              </p>
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> admin1@admin.com
              </p>
              <p className="text-sm text-gray-700">
                <strong>Password:</strong> your password
              </p>
              <p className="text-xs text-blue-500 mt-1">Click to auto-fill</p>
            </div>

            {/* Commission */}
            <div
              className="p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors border border-green-200"
              onClick={() => fillCredentials('commission@test.com', 'Test1234!')}
            >
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                🤝 Commission Module (Meals)
              </p>
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> commission@test.com
              </p>
              <p className="text-sm text-gray-700">
                <strong>Password:</strong> Test1234!
              </p>
              <p className="text-xs text-green-500 mt-1">Click to auto-fill</p>
            </div>
          </div>

        </div>
      </Card>
    </div>
  );
}
