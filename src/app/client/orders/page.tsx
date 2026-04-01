/**
 * CLIENT ORDERS PAGE — Server Component (RSC)
 * 
 * Optimized with Streaming and direct DB fetching.
 * Only interactive parts are Client Islands.
 */

import { Suspense } from 'react';
import { UserRole } from '@/core/domain/auth/UserRole';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { fetchOrders } from '@/infrastructure/http/server-data/serverFetch';
import { SkeletonTable } from '@/components/ui/skeleton';
import { OrderFilters } from './OrderFilters';
import { Pagination } from '@/components/ui/Pagination';
import Link from 'next/link';
import { formatDateReadable, formatCLP } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, ShoppingCart } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

interface Order {
  id: string;
  title?: string | null;
  eventType: string;
  eventDate: string;
  createdAt: string;
  state: string;
  quotationCount: number;
  latestQuotationPrice?: number | null;
}

export default async function ClientOrdersPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session) redirect('/login');
  if (session.role !== UserRole.CLIENT) redirect('/unauthorized');

  const params = await searchParams;

  return (
    <div className="space-y-8 p-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Mis Pedidos</h1>
          <p className="text-muted-foreground mt-2 text-lg">Seguimiento de tus proyectos</p>
        </div>
      </header>

      <OrderFilters
        currentStatus={params.status}
        currentSearch={params.search}
      />

      <Suspense fallback={<SkeletonTable rows={8} />}>
        <OrdersList
          userId={session.userId}
          role={session.role}
          page={parseInt(params.page ?? '1', 10)}
          status={params.status}
          search={params.search}
        />
      </Suspense>
    </div>
  );
}

async function OrdersList({
  userId,
  role,
  page,
  status,
  search,
}: {
  userId: string;
  role: UserRole;
  page: number;
  status?: string | undefined;
  search?: string | undefined;
}) {
  const data = await fetchOrders({
    userId,
    role,
    page,
    limit: 12,
    status,
    search,
  });

  if (data.orders.length === 0) {
    return (
      <div className="text-center py-24 rounded-2xl border border-dashed border-border bg-muted/30">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/50 mb-6" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No se encontraron pedidos</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Intenta ajustar tus filtros o crea una nueva solicitud de cotización.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        basePath="/client/orders"
      />
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 group hover:border-primary/30 transition-all shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">PEDIDO</span>
          <span className="font-bold text-foreground">#{order.id.substring(0, 8)}</span>
        </div>
        <OrderBadge state={order.state} />
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {order.title || 'Servicio Personalizado'}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {order.eventType} en {formatDateReadable(order.eventDate)}
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border/50 pt-4 mt-2">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDateReadable(order.createdAt)}
        </div>
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          {order.quotationCount} Cotizaciones
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total</span>
          <span className="text-lg font-bold text-foreground">
            {order.latestQuotationPrice ? formatCLP(order.latestQuotationPrice) : 'Pendiente'}
          </span>
        </div>
        <Link 
          href={`/client/orders/${order.id}`}
          className="text-sm font-semibold text-primary hover:underline underline-offset-4"
        >
          Ver Detalle →
        </Link>
      </div>
    </div>
  );
}

function OrderBadge({ state }: { state: string }) {
  const configs: Record<string, { variant: "neutral" | "success" | "warning" | "info" | "error" | "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    PAGADA: { variant: 'success', label: 'Pagada' },
    EN_PRODUCCION: { variant: 'info', label: 'En Proceso' },
    ENTREGADA: { variant: 'warning', label: 'Entregada' },
    COMPLETADA: { variant: 'success', label: 'Completada' },
    EN_REVISION: { variant: 'warning', label: 'En Revisión' },
    PENDIENTE_PAGO: { variant: 'warning', label: 'Pendiente Pago' },
  };

  const config = configs[state] ?? { variant: 'neutral' as const, label: state };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
