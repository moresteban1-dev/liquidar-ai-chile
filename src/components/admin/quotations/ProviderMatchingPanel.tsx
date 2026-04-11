'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
 
// [REMOVED] t
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Star, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
 
// [REMOVED] t

interface ProviderMatchRow {
    providerId: string;
    companyName: string;
    rating: number;
    city?: string;
    costPerUnit: number;
    availableQuantity: number | null;
    equipmentCondition?: string;
}

interface MatchingResult {
    itemId: string;
    itemName: string;
    matches: ProviderMatchRow[];
}

interface Props {
    quotationId: string;
}

export function ProviderMatchingPanel({ quotationId }: Props) {
    const [results, setResults] = useState<MatchingResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchMatches() {
            try {
                const res = await fetch(`/api/quotations/${quotationId}/matching`);
                if (!res.ok) {
                    setError('No se pudo cargar el matching');
                    return;
                }
                const data = await res.json();
                setResults(data.results || []);
            } catch {
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        }
        fetchMatches();
    }, [quotationId]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val);

    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center text-muted-foreground text-sm py-6">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No hay datos de inventario para sugerir proveedores.
            </div>
        );
    }

    const coveredItems = results.filter(r => r.matches.length > 0).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">Motor de Matching</h3>
                <Badge variant={coveredItems === results.length ? 'default' : 'secondary'} className="text-xs">
                    {coveredItems}/{results.length} cubiertos
                </Badge>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {results.map((result) => (
                    <div key={result.itemId} className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
                            <span className="text-xs font-medium truncate">{result.itemName}</span>
                            {result.matches.length > 0 ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                            )}
                        </div>

                        {result.matches.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground italic">
                                Sin proveedores disponibles
                            </div>
                        ) : (
                            <div className="divide-y">
                                {result.matches.slice(0, 3).map((match, idx) => (
                                    <div key={match.providerId} className="px-3 py-2 flex items-center justify-between gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                {idx === 0 && <span className="text-[10px]">🏆</span>}
                                                <span className="text-xs font-medium truncate">
                                                    {match.companyName}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                <span className="flex items-center gap-0.5">
                                                    <Star className="w-2.5 h-2.5 text-yellow-500" />
                                                    {match.rating.toFixed(1)}
                                                </span>
                                                {match.city && (
                                                    <span className="flex items-center gap-0.5">
                                                        <MapPin className="w-2.5 h-2.5" />
                                                        {match.city}
                                                    </span>
                                                )}
                                                {match.equipmentCondition && (
                                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                                                        {match.equipmentCondition}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-green-700 whitespace-nowrap">
                                            {formatCurrency(match.costPerUnit)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
