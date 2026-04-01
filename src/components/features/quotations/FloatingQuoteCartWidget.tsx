"use client";

import { useCart } from '@/context/CartContext';
import Link from 'next/link';

// Fallback for icons if lucide not installed (using emoji/svg inline)
const IconCart = () => <span>🛒</span>;
const IconClose = () => <span>✕</span>;

export default function FloatingQuoteCartWidget() {
    const { items, itemCount, isOpen, setIsOpen, removeItem, isLoaded } = useCart();

    if (!isLoaded || itemCount === 0) return null; // Hide if empty or not loaded (prevents hydration mismatch)

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                    <IconCart />
                    <span className="font-bold">{itemCount}</span>
                </button>
            )}

            {/* Backdrop (Mobile + Desktop focus) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Cart Panel */}
            {isOpen && (
                <div className="fixed z-50 flex flex-col bg-card shadow-2xl overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-bottom-10
                    bottom-0 left-0 right-0 w-full rounded-t-2xl border-t border-border max-h-[90vh]
                    md:bottom-6 md:right-6 md:left-auto md:w-full md:max-w-sm md:rounded-2xl md:border md:max-h-[80vh]
                ">
                    {/* Header */}
                    <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center shrink-0">
                        <h3 className="font-bold flex items-center gap-2">
                            <IconCart /> Tu Cotización
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground p-1 rounded-full hover:bg-white/10 transition-colors">
                            <IconClose />
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {items.map((item) => (
                            <div key={item.uniqueId} className="flex justify-between items-start border-b border-border/50 pb-3 last:border-0">
                                <div>
                                    <p className="font-medium text-foreground">{item.name}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">Cant: {item.quantity}</p>
                                </div>
                                <button
                                    onClick={() => removeItem(item.uniqueId)}
                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    <span className="text-xs font-medium">Eliminar</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-muted/30 border-t border-border shrink-0 pb-8 md:pb-4">
                        <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                            <span>Total Items:</span>
                            <span className="font-bold text-foreground">{itemCount}</span>
                        </div>
                        <Link href="/client/quotations/create">
                            <button
                                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                onClick={() => setIsOpen(false)}
                            >
                                Solicitar Cotización <span>→</span>
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
