'use client';

import { Suspense as _Suspense, useState, useEffect } from 'react';
import { SkeletonLine } from '@/components/ui/skeleton';

/**
 * Client Component for the Admin Dashboard.
 * Loaded dynamically to keep the initial main bundle small.
 */

export default function OptimizationPanel() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Simulated fetch of current optimization metrics
    const timer = setTimeout(() => {
      setStats({
        vitals: {
          lcp: '0.8s',
          fcp: '1.1s',
          cls: '0.01',
          ttfb: '120ms'
        },
        bundle: {
          total: '450KB',
          reduction: '62%'
        }
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!stats) return <SkeletonLine width="100%" height="200px" />;

  return (
    <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl backdrop-blur-md animate-in fade-in zoom-in duration-500">
      <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
        Sistema de Optimización Activo
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats.vitals).map(([key, value]: [string, any]) => (
          <div key={key} className="p-3 bg-black/20 rounded-xl border border-white/5">
            <p className="text-[10px] text-muted-foreground uppercase">{key}</p>
            <p className="text-xl font-mono font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Reducción de Bundle Alcanzada:</span>
        <span className="font-bold text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-full">
          {stats.bundle.reduction} ↓
        </span>
      </div>
    </div>
  );
}
