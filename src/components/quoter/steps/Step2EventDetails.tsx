'use client';

import React from 'react';
import { QuoterState } from '../QuoterTypes';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

interface Props {
    state: QuoterState;
    updateState: (updates: Partial<QuoterState>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function Step2EventDetails({ state, updateState, onNext, onBack }: Props) {

    // Basic validation to proceed
    const isComplete =
        (state.date !== null || state.isFlexibleDate) &&
        state.location.trim() !== '' &&
        state.attendees > 0;

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex-grow">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    Cuéntanos más sobre tu evento
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                    Estos detalles nos permiten dimensionar correctamente los equipos y servicios necesarios.
                </p>

                <div className="space-y-8">

                    {/* 1. Date Section */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center mb-4">
                            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Fecha del evento <span className="text-red-500">*</span></h3>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block tracking-wide text-gray-700 text-xs font-bold mb-2">Fecha</label>
                                <input
                                    type="date"
                                    className="appearance-none block w-full bg-gray-50 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-blue-500 disabled:opacity-50"
                                    disabled={state.isFlexibleDate}
                                    onChange={(e) => updateState({ date: new Date(e.target.value) })}
                                />
                            </div>
                        </div>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    className="peer appearance-none w-5 h-5 border-2 border-neutral-300 rounded-md checked:border-blue-600 checked:bg-blue-600 transition-all"
                                    checked={state.isFlexibleDate}
                                    onChange={(e) => updateState({ isFlexibleDate: e.target.checked })}
                                />
                                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 transition-colors">
                                Tengo flexibilidad de fecha <span className="text-emerald-600 dark:text-emerald-400 font-normal ml-1">(+10% descuento potencial)</span>
                            </span>
                        </label>
                    </div>

                    {/* 2. Location Section */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center mb-4">
                            <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Ubicación <span className="text-red-500">*</span></h3>
                        </div>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Ej: Santiago, Región Metropolitana"
                                className="appearance-none block w-full bg-gray-50 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                value={state.location}
                                onChange={(e) => updateState({ location: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {['TENGO_RECINTO', 'NECESITO_RECINTO', 'POR_DEFINIR'].map(status => (
                                <label key={status} className={`
                            flex-1 text-center py-2 px-4 rounded-lg border text-sm font-medium cursor-pointer transition-colors
                            ${state.venueStatus === status
                                        ? 'bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                        : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400'}
                        `}>
                                    <input
                                        type="radio"
                                        name="venueStatus"
                                        className="sr-only"
                                        checked={state.venueStatus === status}
                                        onChange={() => updateState({ venueStatus: status as QuoterState['venueStatus'] })}
                                    />
                                    {status === 'TENGO_RECINTO' && 'Tengo Recinto'}
                                    {status === 'NECESITO_RECINTO' && 'Necesito Recinto'}
                                    {status === 'POR_DEFINIR' && 'Aún no lo defino'}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 3. Attendees Section */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row gap-6 md:items-center">
                        <div className="flex-1">
                            <div className="flex items-center mb-2">
                                <Users className="w-5 h-5 text-blue-600 mr-2" />
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Número de Asistentes <span className="text-red-500">*</span></h3>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <span className="text-3xl font-extrabold text-blue-600 mb-2">{state.attendees} <span className="text-lg text-neutral-500 font-medium">personas</span></span>
                            <input
                                type="range"
                                min="10"
                                max="2000"
                                step="10"
                                value={state.attendees}
                                onChange={(e) => updateState({ attendees: parseInt(e.target.value) })}
                                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-blue-600"
                            />
                            <div className="w-full flex justify-between text-xs text-neutral-400 font-medium mt-2 px-1">
                                <span>50</span>
                                <span>150</span>
                                <span>500</span>
                                <span>1000+</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. Duration Section */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <div className="flex items-center mb-4">
                            <Clock className="w-5 h-5 text-blue-600 mr-2" />
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Duración del Evento <span className="text-red-500">*</span></h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <label className={`flex-1 text-center py-3 px-4 rounded-lg border font-medium cursor-pointer transition-colors ${state.duration === '4H' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'hover:bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                                <input type="radio" name="duration" className="sr-only" checked={state.duration === '4H'} onChange={() => updateState({ duration: '4H' })} />
                                Medio Día (4h)
                            </label>
                            <label className={`flex-1 text-center py-3 px-4 rounded-lg border font-medium cursor-pointer transition-colors ${state.duration === '8H' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'hover:bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                                <input type="radio" name="duration" className="sr-only" checked={state.duration === '8H'} onChange={() => updateState({ duration: '8H' })} />
                                Jornada Completa (8h)
                            </label>
                            <label className={`flex-1 text-center py-3 px-4 rounded-lg border font-medium cursor-pointer transition-colors ${state.duration === 'MULTIPLE' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'hover:bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                                <input type="radio" name="duration" className="sr-only" checked={state.duration === 'MULTIPLE'} onChange={() => updateState({ duration: 'MULTIPLE' })} />
                                Múltiples Días
                            </label>
                        </div>
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
