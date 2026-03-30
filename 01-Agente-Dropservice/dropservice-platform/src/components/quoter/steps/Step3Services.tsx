'use client';

import React, { useState } from 'react';
import { QuoterState } from '../WizardContainer';
import { Check, Plus, Trash2, Info } from 'lucide-react';

interface Props {
    state: QuoterState;
    updateState: (updates: Partial<QuoterState>) => void;
    onNext: () => void;
    onBack: () => void;
}

// Temporary Mock Data representing V2 Catalog output
const recommendedServices = [
    { id: 'SRV-SOUND-PRO', label: 'Sonido Profesional', priceEst: '$950.000', detail: 'Sistema Line Array, Monitores, Microfonía Inalámbrica...' },
    { id: 'SRV-LIGHT-SCENE', label: 'Iluminación Escénica', priceEst: '$750.000', detail: 'Cabezas Móviles, Par LED, Consola DMX, Operador...' },
    { id: 'SRV-LED-SCREEN', label: 'Pantallas LED', priceEst: '$1.200.000', detail: 'Pantalla Pitch 3.9mm Modular de 5x3 metros...' },
    { id: 'SRV-STAGE-MODULAR', label: 'Escenario Modular', priceEst: '$450.000', detail: 'Tarimas Layher a 1m alto, Escalera, Faldón...' },
];

const additionalServices = [
    { id: 'SRV-CATERING', label: 'Catering', priceEst: '$18.000/pers' },
    { id: 'SRV-PHOTO-VIDEO', label: 'Fotografía / Video', priceEst: '$380.000' },
    { id: 'SRV-FURNITURE', label: 'Mobiliario', priceEst: '$285.000' },
    { id: 'SRV-SECURITY', label: 'Seguridad', priceEst: '$190.000' },
    { id: 'SRV-TRANSPORT', label: 'Transporte', priceEst: 'Personalizado' },
    { id: 'SRV-DECOR', label: 'Decoración', priceEst: 'Personalizado' },
];

export default function Step3Services({ state, updateState, onNext, onBack }: Props) {

    const [customServInput, setCustomServInput] = useState('');

    const toggleService = (id: string) => {
        if (state.selectedServices.includes(id)) {
            updateState({ selectedServices: state.selectedServices.filter(s => s !== id) });
        } else {
            updateState({ selectedServices: [...state.selectedServices, id] });
        }
    };

    const addCustomService = () => {
        if (customServInput.trim() === '') return;
        updateState({ customServices: [...state.customServices, customServInput.trim()] });
        setCustomServInput('');
    };

    const removeCustomService = (indexToRemove: number) => {
        updateState({
            customServices: state.customServices.filter((_, idx) => idx !== indexToRemove)
        });
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex-grow">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    ¿Qué servicios necesitas?
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                    Basado en eventos corporativos similares, te recomendamos:
                </p>

                {/* Essential Services */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4">Servicios Esenciales</h3>
                    <div className="space-y-3">
                        {recommendedServices.map(srv => {
                            const isSelected = state.selectedServices.includes(srv.id);
                            return (
                                <div
                                    key={srv.id}
                                    onClick={() => toggleService(srv.id)}
                                    className={`
                                flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer group
                                ${isSelected
                                            ? 'bg-blue-50/50 border-blue-600 dark:bg-blue-900/10 dark:border-blue-500'
                                            : 'bg-white border-neutral-200 hover:border-blue-300 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-600'}
                            `}
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center mr-4 flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-600' : 'bg-neutral-100 border border-neutral-300 dark:bg-neutral-800 dark:border-neutral-600'}`}>
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <span className={`font-semibold ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                {srv.label}
                                            </span>
                                            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Est: {srv.priceEst}</span>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-1 flex items-center">
                                            <Info className="w-3 h-3 mr-1" /> {srv.detail}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Additional Services */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-4">Servicios Adicionales (Opcionales)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {additionalServices.map(srv => {
                            const isSelected = state.selectedServices.includes(srv.id);
                            return (
                                <div
                                    key={srv.id}
                                    onClick={() => toggleService(srv.id)}
                                    className={`
                                flex items-center p-3 rounded-xl border transition-all cursor-pointer
                                ${isSelected
                                            ? 'bg-blue-50/50 border-blue-600 dark:bg-blue-900/10 dark:border-blue-500'
                                            : 'bg-white border-neutral-200 hover:border-blue-300 dark:bg-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-600'}
                            `}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-600' : 'bg-neutral-100 border border-neutral-300 dark:bg-neutral-800 dark:border-neutral-600'}`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-grow flex justify-between items-center">
                                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                            {srv.label}
                                        </span>
                                        <span className="text-xs text-neutral-400">{srv.priceEst}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Custom Services Section */}
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <input
                            type="text"
                            value={customServInput}
                            onChange={e => setCustomServInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addCustomService()}
                            placeholder="Ej: Show de Magia..."
                            className="flex-grow appearance-none bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-blue-500 text-sm"
                        />
                        <button
                            onClick={addCustomService}
                            disabled={customServInput.trim() === ''}
                            className="px-4 py-3 bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 font-medium rounded-lg disabled:opacity-50 flex items-center hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
                        >
                            <Plus className="w-5 h-5" /> Agregar
                        </button>
                    </div>

                    {/* Custom Services Tags */}
                    {state.customServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {state.customServices.map((custom, idx) => (
                                <div key={idx} className="flex items-center px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm rounded-full border border-neutral-200 dark:border-neutral-700">
                                    <span>{custom}</span>
                                    <button onClick={() => removeCustomService(idx)} className="ml-2 text-neutral-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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
