'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/context';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AuthProvider>
  );
}
