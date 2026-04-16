'use client';

import EnterpriseErrorBoundary from '@/components/shared/EnterpriseErrorBoundary';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-black p-8 min-h-[70vh]">
      <EnterpriseErrorBoundary 
        error={error} 
        reset={reset} 
        componentName="Admin Dashboard" 
      />
    </div>
  );
}
