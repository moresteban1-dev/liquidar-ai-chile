import { Skeleton } from '@/components/ui/skeleton';

export default function QuotationsLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-32" />
                ))}
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}
