import { Skeleton } from '@/components/ui/skeleton';

export default function VendorQuotationsLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-64 bg-muted" />
            <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-56 rounded-xl bg-muted" />
                ))}
            </div>
        </div>
    );
}
