'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { LeadsTable } from '@/components/admin/leads/LeadsTable';
import { QuoteSession } from '@/core/domain/quote/QuoteTypes';
import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AdminLeadsClientProps {
  leads: QuoteSession[];
}

export function AdminLeadsClient({ leads }: AdminLeadsClientProps) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Suscripción Realtime para refrescar la lista si hay cambios en la DB
    // Tipamos el canal explícitamente para resolver el error de overloads en Vercel
    const channel: RealtimeChannel = supabase
      .channel('admin-leads-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'v2_quote_sessions' 
        },
        (payload) => {
          logger.info('Realtime Lead Update Received:', payload);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Leads Inteligentes</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Solicitudes generadas por el asistente de IA y el Wizard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="px-3 py-1 text-base">
            {leads.length} leads
          </Badge>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <LeadsTable data={leads} />
      </div>
    </div>
  );
}
