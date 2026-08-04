import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { InferenceTestDashboard } from '@/components/features/admin/event-intelligence/InferenceTestDashboard';
import { BrainCircuit, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/core/domain/auth/UserRole';

export const dynamic = 'force-dynamic';

export default async function InferenceTestPage() {
  const session = await getServerSession();
  if (!session || session.role !== UserRole.ADMIN) redirect('/login');

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
          <Link href="/admin" className="hover:text-primary transition-colors">Admin Console</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Event Intelligence</span>
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
              <BrainCircuit className="h-10 w-10 text-primary" />
              Inference Sandbox
            </h1>
            <p className="text-muted-foreground mt-1">Prueba la lógica de grafos y las reglas de escalado del motor de composición.</p>
          </div>
          <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
            MINI-SPRINT 5.3
          </div>
        </div>
      </header>

      <Suspense fallback={<div className="h-[400px] w-full bg-muted animate-pulse rounded-2xl" />}>
        <InferenceTestDashboard />
      </Suspense>

      <footer className="pt-8 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between items-center text-center">
        <p>© 2026 Liquidar.cl Platform — Event Intelligence Engine v2.0</p>
        <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Repository Online</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Inference Engine READY</span>
        </div>
      </footer>
    </div>
  );
}
