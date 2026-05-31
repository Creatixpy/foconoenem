'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export default function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
