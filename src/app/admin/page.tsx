/**
 * ADMIN DASHBOARD — Server Component (RSC)
 * 
 * Demonstrates:
 * 1. Parallel Data Streaming with Suspense
 * 2. Dynamic Imports for Heavy Panels
 * 3. Direct DB Data Fetching
 */

import { Suspense } from 'react';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { fetchDashboardStats, fetchOrders } from '@/infrastructure/http/server-data/serverFetch';
import { UserRole } from '@/core/domain/auth/UserRole';
import { SkeletonDashboard, SkeletonLine } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation';
import { formatCLP } from '@/lib/formatters';
import { TrendingUp, Users, ShoppingBag, Clock } from 'lucide-react';

import { DashboardOptimizationPanel, DashboardNotificationLogPanel } from './DashboardClientPanels';

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  if (!session || session.role !== UserRole.ADMIN) redirect('/login');

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Central de Control</p>
          <h1 className="text-4xl font-black text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Visión general y optimización de la plataforma inteligente</p>
        </div>
        <div className="flex gap-3 shrink-0">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full border border-emerald-500/20 shadow-sm shadow-emerald-500/5 transition-all hover:bg-emerald-500/20">
                SYSTEM ONLINE
            </span>
        </div>
      </header>

      {/* Dynamic Optimization Panel (Island) */}
      <DashboardOptimizationPanel />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Stats (Streamed) */}
          <Suspense fallback={<div className="grid grid-cols-4 gap-4"><SkeletonLine height="100px" /></div>}>
            <DashboardStats />
          </Suspense>

          {/* Recent Orders (Streamed) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Pedidos Recientes
            </h2>
            <Suspense fallback={<SkeletonDashboard />}>
              <RecentOrdersTable />
            </Suspense>
          </div>
        </div>

        <aside className="space-y-8">
          {/* Notification Island (Island) */}
          <DashboardNotificationLogPanel />
          
          <div className="p-6 glass-card rounded-2xl">
             <h3 className="font-bold mb-3 text-sm">Estado de Infraestructura</h3>
             <div className="space-y-3">
                <InfraItem label="Database" status="Optimal" />
                <InfraItem label="Edge Cache" status="Optimal" />
                <InfraItem label="File Storage" status="Optimal" />
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

async function DashboardStats() {
  const stats = await fetchDashboardStats();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Revenue" value={formatCLP(stats.totalRevenue)} icon={TrendingUp} trend="+12.5%" />
      <StatCard label="Orders" value={stats.totalOrders.toString()} icon={ShoppingBag} />
      <StatCard label="Providers" value={stats.activeProviders.toString()} icon={Users} />
      <StatCard label="Pending" value={stats.pendingQuotations.toString()} icon={Clock} highlight />
    </div>
  );
}

async function RecentOrdersTable() {
  const data = await fetchOrders({ userId: 'admin', role: UserRole.ADMIN, limit: 8 });
  
  return (
    <div className="overflow-hidden glass-card rounded-2xl">
      <table className="order-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {data.orders.map(order => (
            <tr key={order.id}>
              <td className="font-mono text-[10px] text-muted-foreground">#{order.id.substring(0,8)}</td>
              <td className="font-medium text-foreground">{order.clientName || 'N/A'}</td>
              <td>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  order.state === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                }`}>
                  {order.state}
                </span>
              </td>
              <td className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
              <td className="font-bold text-sm">{formatCLP(order.estimatedBudget || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, highlight }: any) {
  return (
    <div className={`p-5 glass-card rounded-2xl ${highlight ? 'border-primary/50' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <Icon className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
        {trend && <span className="text-[10px] font-bold text-emerald-500">{trend}</span>}
      </div>
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
      <p className="text-2xl font-black text-foreground mt-1">{value}</p>
    </div>
  );
}

function InfraItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-emerald-500 font-bold">{status}</span>
    </div>
  );
}
