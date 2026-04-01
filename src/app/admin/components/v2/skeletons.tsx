/**
 * Dashboard Skeletons V2 — Shimmer loading states matching V2 components.
 */
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for Pipeline widget */
export function PipelineSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <div className="flex justify-between">
                <div>
                    <Skeleton className="h-5 w-[180px] mb-1" />
                    <Skeleton className="h-3 w-[130px]" />
                </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-border/30 p-3 text-center space-y-2">
                        <Skeleton className="h-4 w-4 mx-auto rounded-full" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                        <Skeleton className="h-6 w-8 mx-auto" />
                    </div>
                ))}
            </div>
            <div className="space-y-2 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
        </div>
    );
}

/** Skeleton for Revenue Chart */
export function ChartSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-5">
            <Skeleton className="h-5 w-[160px] mb-1" />
            <Skeleton className="h-3 w-[100px] mb-4" />
            <Skeleton className="h-72 w-full rounded-lg" />
        </div>
    );
}

/** Skeleton for small stats card */
export function SmallCardSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
            <Skeleton className="h-5 w-[120px] mb-1" />
            <Skeleton className="h-3 w-[90px]" />
            <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
        </div>
    );
}

/** Skeleton for table or list */
export function TableSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-5">
            <div className="flex justify-between mb-4">
                <div>
                    <Skeleton className="h-5 w-[160px] mb-1" />
                    <Skeleton className="h-3 w-[100px]" />
                </div>
                <Skeleton className="h-8 w-[90px] rounded-md" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    );
}
