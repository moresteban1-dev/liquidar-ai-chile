'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

/**
 * Shared Pagination Component (Client Island)
 * Uses URL search params to drive state, allowing the data table
 * to remain a Server Component while still being interactive.
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  const pages = generatePageNumbers(currentPage, totalPages);

  return (
    <nav className={`flex justify-center gap-1 mt-6 py-4 ${isPending ? 'opacity-50' : ''}`} aria-label="Paginación">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1 || isPending}
        className="min-w-[36px] h-9 border border-border rounded-md bg-card text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Página anterior"
      >
        ←
      </button>

      {pages.map((page, idx) =>
        page === '...' ? (
          <span key={`ellipsis-${idx}`} className="flex items-center px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page as number)}
            disabled={isPending}
            className={`min-w-[36px] h-9 border border-border rounded-md text-sm font-medium transition-all ${
              page === currentPage 
                ? 'bg-primary border-primary text-primary-foreground' 
                : 'bg-card text-muted-foreground hover:border-primary hover:text-primary'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ),
      )}

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages || isPending}
        className="min-w-[36px] h-9 border border-border rounded-md bg-card text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Página siguiente"
      >
        →
      </button>
    </nav>
  );
}

function generatePageNumbers(
  current: number,
  total: number,
): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}
