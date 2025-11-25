'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}
