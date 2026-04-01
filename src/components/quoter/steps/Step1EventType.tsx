'use client';

import React from 'react';
import { QuoterState } from '../WizardContainer';
import { Briefcase, Heart, Music, Tent, Users, PlusCircle } from 'lucide-react';

interface Props {
    state: QuoterState;
    updateState: (updates: Partial<QuoterState>) => void;
    onNext: () => void;
}

const eventTypes = [
    { id: 'CORPORATIVO', label: 'Corporativo', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'SOCIAL', label: 'Social', icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { id: 'FESTIVAL', label: 'Festival', icon: Music, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'FERIA', label: 'Feria / Expo', icon: Tent, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'PUBLICO', label: 'Público / Masivo', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { id: 'OTRO', label: 'Otro', icon: PlusCircle, color: 'text-neutral-600', bg: 'bg-neutral-50 dark:bg-neutral-800' },
];

const subTypes: Record<string, string[]> = {
    CORPORATIVO: ['Lanzamiento de Producto', 'Congreso / Seminario', 'Team Building', 'Cena de Fin de Año', 'Otro Corporativo'],
    SOCIAL: ['Boda', 'Cumpleaños / Aniversario', 'Graduación / Fiesta de Gala', 'Otro Social'],
    FESTIVAL: ['Concierto Musical', 'Festival de Bandas', 'Show de Comedia', 'Espectáculo Teatral'],
    FERIA: ['Feria de Emprendedores', 'Expo Tecnológica', 'Stand Corporativo', 'Activación de Marca'],
    PUBLICO: ['Evento Municipal', 'Campaña Política', 'Acto Cívico', 'Evento Deportivo'],
};

export default function Step1EventType({ state, updateState, onNext }: Props) {

    const handleTypeSelect = (typeId: string) => {
        updateState({ eventType: typeId, eventSubtype: '' }); // Reset subtype when main type changes
    };

    const isComplete = state.eventType !== '' && (state.eventType === 'OTRO' || state.eventSubtype !== '');

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    ¿Qué tipo de evento estás planificando?
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                    Selecciona la categoría que mejor describa tu proyecto para ofrecerte opciones adaptadas.
                </p>

                {/* Main Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {eventTypes.map((type) => {
                        const isSelected = state.eventType === type.id;
                        const Icon = type.icon;

                        return (
                            <button
                                key={type.id}
                                onClick={() => handleTypeSelect(type.id)}
                                className={`
                  relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200
                  ${isSelected
                                        ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/10'
                                        : 'border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-neutral-900'}
                `}
                            >
                                <div className={`p-3 rounded-full mb-3 ${isSelected ? type.bg : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                                    <Icon className={`w-8 h-8 ${isSelected ? type.color : 'text-neutral-500 dark:text-neutral-400'}`} />
                                </div>
                                <span className={`font-semibold text-center ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                    {type.label}
                                </span>

                                {isSelected && (
                                    <div className="absolute top-3 right-3 w-3 h-3 bg-blue-600 rounded-full shadow-sm" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-categories Dropdown (appears only if a main category is selected) */}
                {state.eventType && state.eventType !== 'OTRO' && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-100 dark:border-neutral-800">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 uppercase tracking-wider">
                            Especifica un poco más:
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {subTypes[state.eventType]?.map((sub) => (
                                <label
                                    key={sub}
                                    className={`
                    flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                    ${state.eventSubtype === sub
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                  `}
                                >
                                    <input
                                        type="radio"
                                        name="eventSubtype"
                                        value={sub}
                                        checked={state.eventSubtype === sub}
                                        onChange={(e) => updateState({ eventSubtype: e.target.value })}
                                        className="sr-only" // hidden but accessible
                                    />
                                    <span className="font-medium text-sm">{sub}</span>
                                    {state.eventSubtype === sub && (
                                        <svg className="w-5 h-5 ml-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div className="pt-8 mt-8 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <p className="text-sm text-neutral-500 flex items-center">
                    <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    Si no estás seguro, elige la categoría más cercana.
                </p>
                <button
                    onClick={onNext}
                    disabled={!isComplete}
                    className={`
            px-8 py-3 rounded-xl font-bold transition-all
            ${isComplete
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'}
          `}
                >
                    SIGUIENTE →
                </button>
            </div>
        </div>
    );
}
