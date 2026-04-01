'use client';

/**
 * FavoritesManager — Client-side wishlist for services.
 *
 * Persists favorites in localStorage. Renders a compact card grid
 * with heart toggle and direct "Cotizar" CTA per item.
 */

import { useFavorites } from './use-favorites';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FavoritesManagerProps {
    /** Available services to display in discovery mode */
    availableServices?: { id: string; name: string; slug: string; description: string }[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FavoritesManager({ availableServices = [] }: FavoritesManagerProps) {
    const { favorites, toggleFavorite, isFavorite, loaded } = useFavorites();

    if (!loaded) return null;

    return (
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-[#1a1f3d] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    <h3 className="text-lg font-semibold text-foreground">Mis Favoritos</h3>
                </div>
                <span className="text-xs text-muted-foreground">{favorites.length} guardados</span>
            </div>

            {/* Favorites List */}
            {favorites.length > 0 && (
                <div className="space-y-2 mb-4">
                    {favorites.map(fav => (
                        <div
                            key={fav.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button
                                    onClick={() => toggleFavorite(fav)}
                                    className="shrink-0 p-1 hover:scale-110 transition-transform"
                                    title="Quitar de favoritos"
                                >
                                    <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                                </button>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{fav.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{fav.description}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-indigo-600 shrink-0" asChild>
                                <Link href="/client/quotations/request">
                                    Cotizar
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Discovery: Available services to add */}
            {availableServices.length > 0 && (
                <>
                    <div className="flex items-center gap-2 mb-3 mt-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium text-muted-foreground">Descubrir Servicios</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableServices
                            .filter(s => !isFavorite(s.id))
                            .slice(0, 4)
                            .map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => toggleFavorite(service)}
                                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all text-left"
                                >
                                    <Heart className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{service.name}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{service.description}</p>
                                    </div>
                                </button>
                            ))}
                    </div>
                </>
            )}

            {favorites.length === 0 && availableServices.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    <Heart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Explora el catálogo y guarda tus servicios favoritos</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5" asChild>
                        <Link href="/client/browse">
                            <Sparkles className="h-3.5 w-3.5" />
                            Ver Catálogo
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
