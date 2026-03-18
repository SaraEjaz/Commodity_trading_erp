'use client';

import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { store } from '@/lib/store';
import { hydrate } from '@/lib/slices/authSlice';
import ThemeProvider from './ThemeProvider';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrate());
  }, []);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
