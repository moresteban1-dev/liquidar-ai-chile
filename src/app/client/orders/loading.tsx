import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48 bg-muted" />
            <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-xl bg-muted" />
                ))}
            </div>
        </div>
    );
}
