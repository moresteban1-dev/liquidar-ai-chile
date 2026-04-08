import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { LiquidCard } from '@/components/ui/liquid-card';
import { Plus, Columns } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';

// V2 Components
import { ClientKpisV2 } from './components/v2/kpis';
import { UpcomingEvents } from './components/v2/upcoming-events';
import { ClientActiveQuotations } from './components/v2/active-quotations';
import { CompletedEvents } from './components/v2/completed-events';
import { FinancialSummaryWidget } from './components/v2/financial-summary';
import { PaymentHistory } from './components/v2/payment-history';
import { CalendarWrapper } from './components/v2/calendar-wrapper';
import { DocumentPortal } from './components/v2/document-portal';
import { FavoritesWrapper } from './components/v2/favorites-wrapper';
import { ClientOnboarding } from './components/v2/client-onboarding';

// Skeletons
import { AnalyticsSkeleton, RecentAnalysesSkeleton } from '@/components/skeletons';

export const dynamic = 'force-dynamic';

/**
 * Client Dashboard V2 — Enhanced with KPIs, upcoming events countdown,
 * active quotations with action alerts, and Suspense streaming.
 */
export default async function ClientDashboardPage() {
    const auth = await requireRole(UserRole.CLIENT);
    if (auth.isFailure()) redirect('/login');
    const { user } = auth.getValue();

    return (
        <div className="space-y-6">
            {/* Header */}
            <DashboardHeader
                name="Cliente"
                subtitle="Gestiona tus eventos y cotizaciones desde un solo lugar."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2 border-border/60 hover:bg-accent/50 transition-all font-medium rounded-lg" asChild>
                            <Link href={'/client/compare' as Route}>
                                <Columns className="h-4 w-4 text-muted-foreground" />
                                Comparar
                            </Link>
                        </Button>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all font-semibold rounded-lg" asChild>
                            <Link href="/client/quotations/request">
                                <Plus className="h-4 w-4 shrink-0" />
                                Nueva Solicitud
                            </Link>
                        </Button>
                    </div>
                }
            />

            {/* Row 1: KPIs */}
            <Suspense fallback={<AnalyticsSkeleton />}>
                <ClientKpisV2 userId={user.id} />
            </Suspense>

            {/* Row 2: Upcoming Events + Active Quotations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<RecentAnalysesSkeleton />}>
                    <UpcomingEvents userId={user.id} />
                </Suspense>
                <Suspense fallback={<RecentAnalysesSkeleton />}>
                    <ClientActiveQuotations userId={user.id} />
                </Suspense>
            </div>

            {/* Row 3: Completed Events with Re-quote */}
            <Suspense fallback={<RecentAnalysesSkeleton />}>
                <CompletedEvents userId={user.id} />
            </Suspense>

            {/* Row 4: Financial Summary + Payment History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Suspense fallback={<AnalyticsSkeleton />}>
                    <FinancialSummaryWidget userId={user.id} />
                </Suspense>
                <div className="lg:col-span-2">
                    <Suspense fallback={<RecentAnalysesSkeleton />}>
                        <PaymentHistory userId={user.id} />
                    </Suspense>
                </div>
            </div>

            {/* Row 5: Calendar + Favorites */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<RecentAnalysesSkeleton />}>
                    <CalendarWrapper userId={user.id} />
                </Suspense>
                <Suspense fallback={<RecentAnalysesSkeleton />}>
                    <FavoritesWrapper userId={user.id} />
                </Suspense>
            </div>

            {/* Row 6: Documents */}
            <Suspense fallback={<RecentAnalysesSkeleton />}>
                <DocumentPortal userId={user.id} />
            </Suspense>

            {/* Row 6: CTA Banner */}
            <BentoGrid className="lg:grid-cols-1">
                <BentoGridItem span="row">
                    <LiquidCard className="bg-gradient-to-r from-indigo-600 to-blue-600 border-none text-white">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-lg">¿Necesitas Ayuda?</h3>
                                <p className="text-indigo-100 text-sm">Nuestros expertos revisan tus requerimientos sin costo.</p>
                            </div>
                            <Button variant="secondary" size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-sm shrink-0" asChild>
                                <Link href="/client/quotations/request">Cotizar mi Evento</Link>
                            </Button>
                        </div>
                    </LiquidCard>
                </BentoGridItem>
            </BentoGrid>

            {/* Onboarding — only shows once for new clients */}
            <ClientOnboarding />
        </div>
    );
}
