import { LiquidCard } from '@/components/ui/liquid-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ReactNode } from 'react';

interface Column<T> {
    header: string;
    accessor: (item: T) => ReactNode;
    className?: string; // For explicit width or alignment (e.g. text-right)
}

interface DashboardTableProps<T> {
    title: string;
    subtitle: string;
    actionLabel?: string;
    actionHref?: string;
    columns: Column<T>[];
    data: T[];
    emptyMessage?: string;
}

export function DashboardTable<T extends { id: string | number }>({
    title,
    subtitle,
    actionLabel,
    actionHref,
    columns,
    data,
    emptyMessage = "No hay datos disponibles."
}: DashboardTableProps<T>) {
    return (
        <LiquidCard noPadding>
            <div className="p-5 border-b border-border flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
                {actionLabel && actionHref && (
                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors" asChild>
                        <Link // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            href={actionHref as any}>{actionLabel}</Link>
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
                <table className="w-full text-sm text-left table-auto md:table-fixed">
                    <thead className="bg-muted/50 text-muted-foreground text-xs font-medium uppercase tracking-wider">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} className={`px-5 py-3 ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length > 0 ? (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors duration-150">
                                    {columns.map((col, index) => (
                                        <td key={index} className={`px-5 py-3.5 ${col.className || ''}`}>
                                            {col.accessor(item)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-5 py-8 text-center text-muted-foreground">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </LiquidCard>
    );
}
