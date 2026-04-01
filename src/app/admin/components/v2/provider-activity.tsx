/**
 * Provider Activity V2 — Server Component showing active providers.
 * Displays provider list with active quotes, completed orders, and ratings.
 */
import { getAdminProviderActivity } from '@/lib/dashboard/admin-data.service';
import { Badge } from '@/components/ui/badge';
import { Star, Briefcase, FileText } from 'lucide-react';

export async function ProviderActivity() {
    const providers = await getAdminProviderActivity();

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Actividad de Proveedores</h3>
                <p className="text-sm text-muted-foreground">{providers.length} proveedores registrados</p>
            </div>

            {providers.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay proveedores registrados.
                </div>
            ) : (
                <div className="space-y-3">
                    {providers.map((p) => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Avatar placeholder */}
                                <div className="h-9 w-9 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                        {p.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {/* Active Quotes */}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Cotizaciones activas">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span className="tabular-nums">{p.activeQuotes}</span>
                                </div>

                                {/* Completed Orders */}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Pedidos completados">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    <span className="tabular-nums">{p.completedOrders}</span>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-1 text-xs" title="Calificación">
                                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                    <span className="font-semibold text-foreground tabular-nums">{p.rating.toFixed(1)}</span>
                                </div>

                                {/* Status Badge */}
                                <Badge variant={p.activeQuotes > 0 ? 'info' : 'neutral'}>
                                    {p.activeQuotes > 0 ? 'Activo' : 'Disponible'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
