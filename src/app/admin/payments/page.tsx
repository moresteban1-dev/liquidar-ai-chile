import { Suspense } from 'react';
import { AdminPaymentsPanel } from '../components/admin-payments-panel';

function PaymentsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
            </div>
            <div className="h-[400px] bg-muted rounded-xl" />
        </div>
    );
}

export default function AdminPaymentsPage() {
    return (
        <Suspense fallback={<PaymentsSkeleton />}>
            <AdminPaymentsPanel />
        </Suspense>
    );
}
