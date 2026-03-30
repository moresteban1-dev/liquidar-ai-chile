import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}
