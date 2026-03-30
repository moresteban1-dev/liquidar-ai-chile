'use client';

import { QuoteWizard } from '@/components/quotations/QuoteWizard';

export default function RequestQuotePage() {
    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                    Nueva Cotización
                </h1>
                <p className="text-muted-foreground mt-2">
                    Configura tu evento paso a paso
                </p>
            </div>

            <QuoteWizard />
        </div>
    );
}
