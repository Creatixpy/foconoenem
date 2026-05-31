'use client';

import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthProvider } from '@/lib/auth/context';

type AuthProvidersProps = {
  children: ReactNode;
  initialUser?: User | null;
  initialAuthChecked?: boolean;
};

export default function AuthProviders({
  children,
  initialUser = null,
  initialAuthChecked = false,
}: AuthProvidersProps) {
  return (
    <AuthProvider initialUser={initialUser} initialAuthChecked={initialAuthChecked}>
      {children}
    </AuthProvider>
  );
}
