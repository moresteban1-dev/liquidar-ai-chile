'use client';

import EnterpriseErrorBoundary from '@/components/shared/EnterpriseErrorBoundary';

export default function ClientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-white dark:bg-neutral-950 p-6 min-h-[60vh]">
      <EnterpriseErrorBoundary 
        error={error} 
        reset={reset} 
        componentName="Client Portal" 
      />
    </div>
  );
}
