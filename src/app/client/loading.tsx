// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Card, CardContent, CardHeader as _CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientLoading() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </header>

            <section>
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="overflow-hidden border-none shadow-md">
                            <Skeleton className="h-32 w-full rounded-none" />
                            <CardContent className="p-4 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-8 w-full mt-4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="mt-12">
                <Skeleton className="h-6 w-48 mb-4" />
                <Card>
                    <CardContent className="p-0">
                        <div className="space-y-0 divide-y">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
