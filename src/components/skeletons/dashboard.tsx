import { Skeleton } from '@/components/ui/skeleton';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';

export function DashboardKpiSkeleton() {
    return (
        <BentoGrid className="lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <BentoGridItem key={i}>
                    <div className="p-6 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-32 my-2" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </BentoGridItem>
            ))}
        </BentoGrid>
    );
}

export function DashboardTableSkeleton() {
    return (
        <BentoGrid className="lg:grid-cols-1">
            <BentoGridItem span="row">
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-9 w-24" />
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </BentoGridItem>
        </BentoGrid>
    );
}
