import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/supabase/api';
import { UserRole } from '@/core/domain/auth/UserRole';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getClientQuotationsForComparison } from '@/lib/dashboard/client-data.service';
import { QuotationComparator } from '../components/v2/quotation-comparator';
import { RecentAnalysesSkeleton } from '@/components/skeletons';

export const dynamic = 'force-dynamic';

/**
 * /client/compare — Quotation comparison page.
 */
export default async function ComparePage() {
    const auth = await requireRole(UserRole.CLIENT);
    if (auth.isFailure()) redirect('/login');
    const { user } = auth.getValue();

    const quotations = await getClientQuotationsForComparison(user.id);

    return (
        <div className="space-y-6">
            <DashboardHeader
                name="Comparar Cotizaciones"
                subtitle="Selecciona hasta 3 cotizaciones para comparar lado a lado."
                actions={
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                        <Link href="/client">
                            <ArrowLeft className="h-4 w-4" />
                            Volver al Dashboard
                        </Link>
                    </Button>
                }
            />

            <Suspense fallback={<RecentAnalysesSkeleton />}>
                <QuotationComparator quotations={quotations} />
            </Suspense>
        </div>
    );
}
