"use client";

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import React, { createContext, useContext, useEffect, useState } from 'react';
import posthog from 'posthog-js';

export interface CartItem {
    uniqueId: string; // generated uuid for list keys
    serviceId: string;
    name: string;
    priceEstimate?: number;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "uniqueId">) => void;
    removeItem: (uniqueId: string) => void;
    clearCart: () => void;
    itemCount: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Persistence (Client Side Only)
    useEffect(() => {
        const saved = localStorage.getItem("quote-cart");
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                logger.error("Failed to parse cart", e);
            }
        }
        setIsLoaded(true); // Mark as loaded after reading from storage
    }, []);

    useEffect(() => {
        if (isLoaded) { // Only save if loaded to avoid overwriting with empty
            localStorage.setItem("quote-cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addItem = (newItem: Omit<CartItem, "uniqueId">) => {
        const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36);

        const item: CartItem = { ...newItem, uniqueId };
        setItems((prev) => [...prev, item]);
        setIsOpen(true); // Auto open

        try {
            posthog.capture('added_to_cart', {
                service_id: item.serviceId,
                name: item.name,
                price: item.priceEstimate,
                quantity: item.quantity
            });
        } catch (e) {
            logger.error("Posthog capture failed", e);
        }
    };

    const removeItem = (uniqueId: string) => {
        setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));
    };

    const clearCart = () => {
        setItems([]);
        setIsOpen(false);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                clearCart,
                itemCount: items.length,
                isOpen,
                setIsOpen,
                isLoaded
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
