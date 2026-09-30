'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isWorkspacePath } from '@/lib/client/workspace-navigation';

export default function FooterVariant({ full, compact }: { full: ReactNode; compact: ReactNode }) {
  return isWorkspacePath(usePathname()) ? compact : full;
}
