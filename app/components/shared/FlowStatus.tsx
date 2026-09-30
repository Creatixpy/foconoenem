import type { ReactNode } from 'react';

export default function FlowStatus({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div role={error ? 'alert' : 'status'} aria-atomic="true" className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-[var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)]'}`}>
      {children}
    </div>
  );
}
