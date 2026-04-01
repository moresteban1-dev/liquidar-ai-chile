'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

/**
 * Client Component — Interactive filter controls.
 * This is the only JS shipped for this page.
 * Uses URL search params for state (no client-side state needed).
 */

interface OrderFiltersProps {
  currentStatus?: string | undefined;
  currentSearch?: string | undefined;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'IN_PRODUCTION', label: 'En Proceso' },
  { value: 'INTERNAL_REVIEW', label: 'Revisión Interna' },
  { value: 'DELIVERED', label: 'Entregada' },
  { value: 'UNDER_REVIEW', label: 'Cambios Solicitados' },
  { value: 'COMPLETED', label: 'Completada' },
];

export function OrderFilters({ currentStatus, currentSearch }: OrderFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // Reset page on filter change

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className={`filters-bar mb-6 p-4 bg-muted/30 border border-border rounded-xl flex flex-wrap gap-4 items-end ${isPending ? 'opacity-60' : ''}`}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="status-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Estado
        </label>
        <select
          id="status-filter"
          className="bg-background border border-border rounded-md px-3 py-2 text-sm min-w-[160px] outline-none focus:ring-2 focus:ring-primary/20"
          value={currentStatus ?? ''}
          onChange={(e) => updateParams('status', e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
        <label htmlFor="search-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Buscar
        </label>
        <input
          id="search-filter"
          type="search"
          className="bg-background border border-border rounded-md px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Buscar por título o ID..."
          defaultValue={currentSearch ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            const timeout = setTimeout(() => {
              updateParams('search', value);
            }, 500);
            return () => clearTimeout(timeout);
          }}
        />
      </div>

      {isPending && (
        <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">Actualizando...</span>
        </div>
      )}
    </div>
  );
}
