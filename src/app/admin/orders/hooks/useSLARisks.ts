import { useState, useEffect, useCallback } from 'react';
import { auditActiveSLAAction } from '@/actions/sla-actions';
import { logger } from '@infrastructure/telemetry/StructuredLogger';

export type SLARiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SLARisk {
  level: SLARiskLevel;
  reason: string;
}

export interface UseSLARisksResult {
  slaRisks: Record<string, SLARisk>;
  isAuditing: boolean;
  runSLAAudit: () => Promise<void>;
}

/**
 * NASA-Grade Engineering: Custom Hook for SLA Risk Monitoring
 * 
 * Optimized with useCallback to prevent unnecessary re-audits.
 */
export function useSLARisks(): UseSLARisksResult {
  const [slaRisks, setSlaRisks] = useState<Record<string, SLARisk>>({});
  const [isAuditing, setIsAuditing] = useState(false);

  const runSLAAudit = useCallback(async () => {
    setIsAuditing(true);
    try {
      const result = await auditActiveSLAAction();
      if (result.success && result.data) {
        const risksMap: Record<string, SLARisk> = {};
        (result.data as any[]).forEach(item => {
          risksMap[item.orderId] = {
            level: item.riskLevel as SLARiskLevel,
            reason: item.reason
          };
        });
        setSlaRisks(risksMap);
      }
    } catch (err) {
      logger.error('SLA Audit failed', err);
    } finally {
      setIsAuditing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runSLAAudit();
  }, [runSLAAudit]);

  return {
    slaRisks,
    isAuditing,
    runSLAAudit
  };
}
