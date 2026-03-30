/**
 * CLIENT ORDER DETAIL PAGE — Server Component (RSC)
 * 
 * High performance rendering with direct data access.
 * Only the mutation actions are Client Components.
 */

import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { fetchOrderDetail } from '@/infrastructure/http/server-data/serverFetch';
import { SkeletonOrderDetail } from '@/components/ui/skeleton';
import QuotationActions from './QuotationActions';
import Link from 'next/link';
import { formatCLP, formatDateReadable } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await getServerSession();
  if (!session) redirect('/login');

  const { id } = await params;

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8">
        <Link href="/client/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          ← Volver a Mis Pedidos
        </Link>
      </header>

      <Suspense fallback={<SkeletonOrderDetail />}>
        <OrderContent orderId={id} userRole={session.role} />
      </Suspense>
    </div>
  );
}

async function OrderContent({ orderId, userRole }: { orderId: string; userRole: string }) {
  const order = await fetchOrderDetail(orderId, userRole);

  if (!order) notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{order.title}</h1>
            <Badge variant={(order.state === 'COMPLETED' ? 'success' : 'info') as any}>
              {order.state}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">
            ID: {order.id}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">PRESUPUESTO ESTIMADO</p>
          <p className="text-3xl font-black text-foreground">
            {order.estimatedBudget ? formatCLP(order.estimatedBudget) : 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="glass-card p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📝 Descripción del Proyecto
            </h2>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {order.description || 'No hay descripción detallada para este pedido.'}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              💰 Cotizaciones Recibidas
            </h2>
            {order.quotations.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl text-muted-foreground">
                Esperando cotizaciones de los proveedores...
              </div>
            ) : (
              <div className="space-y-4">
                {order.quotations.map((q) => (
                  <div key={q.id} className="glass-card p-6 rounded-2xl border-l-4 border-l-primary">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">PROPUESTA ECONÓMICA</span>
                        <p className="text-2xl font-bold mt-1">{formatCLP(q.clientPrice)}</p>
                      </div>
                      <Badge variant={(q.status === 'SENT' ? 'info' : 'neutral') as any}>
                        {q.status === 'SENT' ? 'Pendiente tu Revisión' : q.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-foreground/70 mb-4 italic">
                      "{q.notes || 'Sin notas adicionales.'}"
                    </p>

                    {q.status === 'SENT' && (
                        <QuotationActions quotationId={q.id} orderId={order.id} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="glass-card p-6 rounded-2xl">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Detalles</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Tipo de Evento</p>
                <p className="font-semibold">{order.eventType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Fecha del Evento</p>
                <p className="font-semibold">{formatDateReadable(order.eventDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Prioridad</p>
                <Badge variant={(order.urgency === 'HIGH' ? 'error' : 'secondary') as any}>
                  {order.urgency}
                </Badge>
              </div>
            </div>
          </section>

          {order.provider && (
            <section className="glass-card p-6 rounded-2xl bg-primary/5 border-primary/20">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Proveedor Asignado</h2>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {order.provider.name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{order.provider.name}</p>
                  <p className="text-xs text-muted-foreground">{order.provider.company || 'Independiente'}</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
