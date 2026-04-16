'use client';

import EnterpriseErrorBoundary from '@/components/shared/EnterpriseErrorBoundary';

export default function VendorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-neutral-900 border border-neutral-800 p-8 min-h-[70vh]">
      <EnterpriseErrorBoundary 
        error={error} 
        reset={reset} 
        componentName="Vendor Hub" 
      />
    </div>
  );
}
