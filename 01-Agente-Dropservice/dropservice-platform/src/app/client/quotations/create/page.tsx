"use client";

import { useCart } from '@/context/CartContext';
import { QuoteWizard } from '@/components/quotations/QuoteWizard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CheckoutPage() {
    const { items, itemCount } = useCart();

    if (itemCount === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4 text-foreground">Tu carrito está vacío</h1>
                    <Link href="/">
                        <Button>Volver al Catálogo</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-6">
            <div className="max-w-4xl mx-auto mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                    Finalizar Cotización
                </h1>
                <p className="text-muted-foreground mt-2">
                    Completa tus datos para enviarnos la solicitud de los items seleccionados.
                </p>
            </div>

            <QuoteWizard
                initialItems={items.map(i => ({
                    serviceId: i.serviceId,
                    quantity: i.quantity,
                    name: i.name,
                    priceEstimate: i.priceEstimate
                }))}
            />
        </div>
    );
}
