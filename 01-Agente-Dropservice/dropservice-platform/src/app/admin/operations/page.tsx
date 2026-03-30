import { redirect } from 'next/navigation';
import { getServerSession } from '@/infrastructure/http/server-data/getServerSession';
import { SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { UserRole } from '@/core/domain/auth/UserRole';

const SystemHealthPanel = dynamic(
  () => import('./SystemHealthPanel'),
  { loading: () => <SkeletonCard /> },
);

const NotificationLogViewer = dynamic(
  () => import('./NotificationLogViewer'),
  { loading: () => <SkeletonTable rows={5} /> },
);

const WebhookManager = dynamic(
  () => import('./WebhookManager'),
  { loading: () => <SkeletonTable rows={3} /> },
);

const CacheMonitor = dynamic(
  () => import('./CacheMonitor'),
  { loading: () => <SkeletonCard /> },
);

const EventQueueViewer = dynamic(
  () => import('./EventQueueViewer'),
  { loading: () => <SkeletonCard /> },
);

export default async function OperationsPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');
  if (session.role !== UserRole.ADMIN) redirect('/unauthorized');

  return (
    <div className="page-container p-6">
      <header className="page-header mb-8">
        <h1 className="page-title text-2xl font-bold">Operations Center</h1>
        <p className="page-subtitle text-muted-foreground">
          Real-time system monitoring and operational management.
        </p>
      </header>

      <div className="operations-grid">
        {/* System Health — Full Width */}
        <section className="operations-section full-width">
          <h2 className="section-title">🩺 System Health</h2>
          <SystemHealthPanel />
        </section>

        {/* Two Column Layout */}
        <section className="operations-section">
          <h2 className="section-title">📊 Cache Monitor</h2>
          <CacheMonitor />
        </section>

        <section className="operations-section">
          <h2 className="section-title">📬 Event Queue</h2>
          <EventQueueViewer />
        </section>

        {/* Notification Log — Full Width */}
        <section className="operations-section full-width">
          <h2 className="section-title">📧 Notification Log</h2>
          <NotificationLogViewer />
        </section>

        {/* Webhook Manager — Full Width */}
        <section className="operations-section full-width">
          <h2 className="section-title">🔗 Webhook Manager</h2>
          <WebhookManager />
        </section>
      </div>
    </div>
  );
}
