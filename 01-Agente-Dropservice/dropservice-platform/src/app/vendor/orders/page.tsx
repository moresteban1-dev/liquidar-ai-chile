/**
 * Vendor Orders Page — RSC (Server Component)
 * Fetches vendor orders server-side and passes to interactive client component.
 */

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getVendorOrders } from '@/actions/quotations';
import { VendorOrdersClient } from './VendorOrdersClient';

function VendorOrdersSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48 bg-muted" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-xl bg-muted" />
                ))}
            </div>
        </div>
    );
}

async function VendorOrdersContent() {
    const orders = await getVendorOrders();
    return <VendorOrdersClient orders={orders} />;
}

export default function VendorOrdersPage() {
    return (
        <Suspense fallback={<VendorOrdersSkeleton />}>
            <VendorOrdersContent />
        </Suspense>
    );
}
