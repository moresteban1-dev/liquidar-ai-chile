import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export interface UseVendorRealtimeResult {
  lastUpdate: number;
}

/**
 * NASA-Grade Engineering: Custom Hook for Vendor Realtime Updates
 * 
 * Optimized to handle Supabase channels safely with React's lifecycle.
 */
export function useVendorRealtime(): UseVendorRealtimeResult {
  const router = useRouter();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('vendor-quotations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quotations' },
        (payload: { eventType: string; schema: string; table: string; record: unknown; oldRecord: unknown }) => {
          logger.info('Realtime Quotation Update Received (Vendor):', payload);
          setLastUpdate(Date.now());
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return { lastUpdate };
}
