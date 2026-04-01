// ============================================================
// components/checkout/PaymentMethodSelector.tsx
// ============================================================

'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import { useState, useEffect } from 'react';
import { PaymentGateway, GatewaySlug } from '@/types/payments';
import { CreditCard, Building2, ArrowRight, Loader2 } from 'lucide-react';

interface Props {
    onSelect: (slug: GatewaySlug) => void;
    selected: GatewaySlug | null;
}

const GATEWAY_ICONS: Record<string, React.ReactNode> = {
    webpay: <CreditCard className="w-6 h-6" />,
    manual_transfer: <Building2 className="w-6 h-6" />,
};

export function PaymentMethodSelector({ onSelect, selected }: Props) {
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGateways();
    }, []);

    async function fetchGateways() {
        try {
            // Fetch public gateways (busting cache and ensuring JSON response)
            const resPublic = await fetch(`/api/payments/gateways?_t=${Date.now()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'
            });
            if (!resPublic.ok) throw new Error(`HTTP Error ${resPublic.status}`);

            const data = await resPublic.json();
            setGateways(data.gateways || []);
        } catch (error) {
            logger.error('Error cargando métodos de pago:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Cargando métodos de pago...</span>
            </div>
        );
    }

    if (gateways.length === 0) {
        return (
            <div className="p-6 text-center bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">
                    No hay métodos de pago disponibles en este momento.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">
                Método de pago
            </h3>
            <div className="grid gap-3">
                {gateways.map((gw) => (
                    <button
                        key={gw.id}
                        onClick={() => onSelect(gw.slug)}
                        className={`
              relative flex items-center gap-4 p-4 rounded-xl border-2
              transition-all duration-200 text-left w-full
              ${selected === gw.slug
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            }
            `}
                    >
                        {/* Radio indicator */}
                        <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${selected === gw.slug
                                ? 'border-blue-500'
                                : 'border-gray-300'
                            }
            `}>
                            {selected === gw.slug && (
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            )}
                        </div>

                        {/* Icon */}
                        <div className={`
              p-2 rounded-lg
              ${selected === gw.slug
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-500'
                            }
            `}>
                            {GATEWAY_ICONS[gw.slug] || <CreditCard className="w-6 h-6" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{gw.name}</p>
                            <p className="text-sm text-gray-500">{gw.description}</p>
                        </div>

                        {/* Arrow */}
                        {selected === gw.slug && (
                            <ArrowRight className="w-5 h-5 text-blue-500" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
