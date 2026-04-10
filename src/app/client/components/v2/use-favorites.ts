'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'client-favorites';

export interface FavoriteService {
    id: string;
    name: string;
    slug: string;
    description: string;
    addedAt: string;
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteService[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFavorites(JSON.parse(stored));
            }
        } catch { /* localStorage not available */ }
        setLoaded(true);
    }, []);

    // Persist
    const persist = useCallback((updated: FavoriteService[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch { /* localStorage not available */ }
    }, []);

    const toggleFavorite = useCallback((service: { id: string; name: string; slug: string; description: string }) => {
        setFavorites(prev => {
            const exists = prev.find(f => f.id === service.id);
            let updated: FavoriteService[];
            if (exists) {
                updated = prev.filter(f => f.id !== service.id);
            } else {
                updated = [...prev, { ...service, addedAt: new Date().toISOString() }];
            }
            persist(updated);
            return updated;
        });
    }, [persist]);

    const favoriteIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites]);

    const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

    return {
        favorites,
        toggleFavorite,
        isFavorite,
        loaded
    };
}
