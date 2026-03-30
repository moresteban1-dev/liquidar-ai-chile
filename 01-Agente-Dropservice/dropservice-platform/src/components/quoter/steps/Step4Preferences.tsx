'use client';

import React, { useState } from 'react';
import { QuoterState } from '../WizardContainer';
import { DollarSign, Leaf, Map, MessageSquare, GripVertical } from 'lucide-react';

interface Props {
    state: QuoterState;
    updateState: (updates: Partial<QuoterState>) => void;
    onNext: () => void;
    onBack: () => void;
}

// Fixed set of priorities just for this demo
const defaultPriorities = [
    'Calidad técnica del evento',
    'Cumplir con el presupuesto',
    'Proveedores con experiencia',
    'Rapidez de ejecución',
];

export default function Step4Preferences({ state, updateState, onNext, onBack }: Props) {

    // Use state.priorities if populated, otherwise initialize with default
    const [items, setItems] = useState<string[]>(
        state.priorities.length > 0 ? state.priorities : defaultPriorities
    );

    // Simple drag n drop logic
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const handleDragStart = (idx: number) => setDraggedIdx(idx);

    const handleDragEnter = (idx: number) => {
        if (draggedIdx === null || draggedIdx === idx) return;
        const newItems = [...items];
        const draggedItem = newItems[draggedIdx];
        newItems.splice(draggedIdx, 1);
        newItems.splice(idx, 0, draggedItem);
        setDraggedIdx(idx);
        setItems(newItems);
        updateState({ priorities: newItems });
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
        updateState({ priorities: items });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex-grow">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    Ajusta tus preferencias
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                    Estos datos nos permiten crear las 3 opciones (Económica, Recomendada, Premium) de forma inteligente.
                </p>

                <div className="space-y-8">

                    {/* 1. Budget Section */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row gap-6 md:items-center">
                        <div className="flex-1">
                            <div className="flex items-center mb-2">
                                <DollarSign className="w-5 h-5 text-emerald-600 mr-2" />
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Presupuesto Estimado <span className="text-red-500">*</span></h3>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center w-full">
                            <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 py-3 px-4 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center mb-3">
                                <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{formatCurrency(state.budget)}</span>
                            </div>
                            <input
                                type="range"
                                min="1000000"
                                max="30000000"
                                step="500000"
                                value={state.budget}
                                onChange={(e) => updateState({ budget: parseInt(e.target.value) })}
                                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-emerald-600"
                            />
                            <div className="w-full flex justify-between text-xs text-neutral-400 font-medium mt-2 px-1">
                                <span>$1M</span>
                                <span>$10M</span>
                                <span>$20M</span>
                                <span>$30M+</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Drag & Drop Priorities */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Prioridades <span className="text-neutral-400 font-normal text-sm ml-2">(Ordena arrastrando)</span></h3>
                        </div>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div
                                    key={item}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragEnter={() => handleDragEnter(index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={`
                                flex items-center p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 cursor-move transition-transform
                                ${draggedIdx === index ? 'opacity-50 scale-[0.98]' : 'hover:border-blue-300 dark:hover:border-blue-600 shadow-sm'}
                            `}
                                >
                                    <GripVertical className="w-5 h-5 text-neutral-400 mr-3" />
                                    <span className="font-bold text-blue-600 dark:text-blue-500 mr-3">{index + 1}.</span>
                                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Sustainable & Permits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <div className="flex items-center mb-4">
                                <Leaf className="w-5 h-5 text-green-600 mr-2" />
                                <h3 className="font-semibold text-neutral-900 dark:text-white">¿Evento Sustentable?</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                {['SI', 'INTERESA', 'NO'].map(val => {
                                    const isSelected = (val === 'SI' && state.isSustainable) || (val === 'INTERESA') || (val === 'NO' && !state.isSustainable);
                                    // Simplified for demo, mapped to boolean
                                    return (
                                        <label key={val} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                                            <input type="radio" name="sust" className="mr-3 accent-green-600 w-4 h-4" checked={isSelected} onChange={() => updateState({ isSustainable: val === 'SI' })} />
                                            {val === 'SI' && 'Sí, es prioritario'}
                                            {val === 'INTERESA' && 'Me interesa explorarlo'}
                                            {val === 'NO' && 'No es importante'}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <div className="flex items-center mb-4">
                                <Map className="w-5 h-5 text-amber-600 mr-2" />
                                <h3 className="font-semibold text-neutral-900 dark:text-white">¿Permisos Municipales?</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                {[
                                    { id: 'SI_TODO', label: 'Sí, gestionen todo' },
                                    { id: 'SOLO_ASESORIA', label: 'Solo requiero asesoría' },
                                    { id: 'NO', label: 'No necesito / Ya los tengo' }
                                ].map(opt => (
                                    // eslint-disable-next-line react/jsx-no-comment-textnodes
                                    <label key={opt.id} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${state.needsPermits === opt.id ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        <input type="radio" name="permits" className="mr-3 accent-amber-600 w-4 h-4" checked={state.needsPermits === opt.id} onChange={() => updateState({ needsPermits: opt.id as any })} />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. Comments */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center mb-4">
                            <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Comentarios Adicionales <span className="text-neutral-400 font-normal text-sm ml-1">(Opcional)</span></h3>
                        </div>
                        <textarea
                            value={state.comments}
                            onChange={(e) => updateState({ comments: e.target.value })}
                            placeholder="Ej: Necesitamos que el escenario tenga rampa para sillas de ruedas, o que el montaje sea silencioso antes del mediodía..."
                            className="w-full bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg py-3 px-4 focus:outline-none focus:bg-white focus:border-blue-500 text-sm min-h-[100px] resize-y"
                        />
                    </div>

                </div>
            </div>

            {/* Footer / Actions */}
            <div className="pt-8 mt-8 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="px-6 py-3 rounded-xl font-bold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                >
                    ◄ ANTERIOR
                </button>
                <button
                    onClick={onNext}
                    className={`px-8 py-3 rounded-xl font-bold transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25`}
                >
                    SIGUIENTE →
                </button>
            </div>
        </div>
    );
}
