import React from 'react';
import WizardContainer from '@/components/quoter/WizardContainer';

export const metadata = {
    title: 'Cotizador Inteligente | Liquidar.cl Subastas y Liquidaciones',
    description: 'Obtén una cotización inmediata y personalizada para la producción técnica de tu evento.',
};

export default function QuoterPage() {
    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
                        Cotizador Inteligente
                    </h1>
                    <p className="mt-4 text-xl text-neutral-500 dark:text-neutral-400">
                        Diseñemos juntos la experiencia técnica de tu próximo evento en 5 simples pasos.
                    </p>
                </div>

                {/* The orchestrator component that holds the state */}
                <WizardContainer />

            </div>
        </main>
    );
}
