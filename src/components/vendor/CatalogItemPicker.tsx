'use client';

/**
 * CatalogItemPicker — Combobox para vincular ítems del RFP al catálogo maestro.
 *
 * Permite al proveedor buscar en el catálogo y seleccionar un ítem,
 * auto-completando el concepto y dando contexto de precio de mercado.
 * La selección es opcional: el proveedor puede escribir free-text.
 */

 
import React, { useState, useEffect, useMemo as _useMemo, useRef, useCallback } from 'react';
import { Search, Link2, Unlink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CatalogItemOption {
    id: string;
    name: string;
    code: string;
    categoryName: string;
    itemType: string;
    unitLabel: string;
    priceSuggested: number | null;
    priceReferenceMin: number | null;
    priceReferenceMax: number | null;
}

interface Props {
    /** Currently linked catalog item ID */
    value: string | null;
    /** Callback when a catalog item is selected or cleared */
    onChange: (item: CatalogItemOption | null) => void;
    /** Compact mode for inline use */
    compact?: boolean;
}

/** Debounce delay for API search (ms) */
const SEARCH_DEBOUNCE_MS = 300;

 
export function CatalogItemPicker({ value, onChange, compact: _compact = true }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [catalogItems, setCatalogItems] = useState<CatalogItemOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CatalogItemOption | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch catalog items when dropdown opens or search changes
    useEffect(() => {
        if (!isOpen) return;

        const fetchItems = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (debouncedSearch) params.set('search', debouncedSearch);
                const res = await fetch(`/api/catalog/items?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setCatalogItems(data.items || []);
                }
            } catch {
                // Silently fail — items will show as empty
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [isOpen, debouncedSearch]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = useCallback((item: CatalogItemOption) => {
        setSelectedItem(item);
        onChange(item);
        setIsOpen(false);
        setSearchTerm('');
    }, [onChange]);

    const handleClear = useCallback(() => {
        setSelectedItem(null);
        onChange(null);
    }, [onChange]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(val);

    // If we have a value but no selectedItem, show linked state
    if (value && selectedItem) {
        return (
            <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200 gap-1 truncate max-w-[180px]">
                    <Link2 className="w-2.5 h-2.5" />
                    {selectedItem.name}
                </Badge>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-muted-foreground hover:text-red-500"
                    onClick={handleClear}
                    title="Desvincular del catálogo"
                >
                    <Unlink className="w-3 h-3" />
                </Button>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-muted-foreground hover:text-blue-600 px-1.5 gap-1"
                onClick={() => setIsOpen(!isOpen)}
                title="Vincular a ítem del catálogo maestro"
            >
                <Link2 className="w-3 h-3" />
                Vincular catálogo
            </Button>

            {isOpen && (
                <div className="absolute z-50 top-7 left-0 w-80 bg-popover border rounded-lg shadow-lg p-2 space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en catálogo..."
                            className="pl-8 h-8 text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[240px] overflow-y-auto space-y-0.5">
                        {loading ? (
                            <div className="flex items-center justify-center py-4 text-muted-foreground text-xs gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Buscando...
                            </div>
                        ) : catalogItems.length === 0 ? (
                            <div className="text-center text-muted-foreground text-xs py-4">
                                {debouncedSearch ? 'Sin resultados' : 'Sin ítems disponibles'}
                            </div>
                        ) : (
                            catalogItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    className="w-full text-left p-2 rounded hover:bg-muted/60 transition-colors"
                                >
                                    <div className="text-xs font-medium truncate">{item.name}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-muted-foreground">{item.categoryName}</span>
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                                            {item.itemType}
                                        </Badge>
                                        {item.priceSuggested && (
                                            <span className="text-[10px] text-green-600 ml-auto">
                                                {formatCurrency(item.priceSuggested)}/{item.unitLabel}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
