'use client';

import { logger } from '@infrastructure/telemetry/StructuredLogger';
import React, { useState, useEffect } from 'react';
import { QuoterState } from '../WizardContainer';
import { User, Mail, Phone, Briefcase, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { getDownPaymentAction, submitQuoteSessionAction } from '@/actions/quoter';
import { QuoteSession } from '@core/domain/quote/QuoteTypes';
interface Props {
    state: QuoterState;
    updateState: (updates: Partial<QuoterState>) => void;
    onBack: () => void;
}

export default function Step5LeadData({ state, updateState, onBack }: Props) {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [savedSession, setSavedSession] = useState<QuoteSession | null>(null);
    const [downPaymentPct, setDownPaymentPct] = useState(30); // Default fallback

    // Fetch dynamic down payment configured by Admin on component mount
    useEffect(() => {
        async function loadConfig() {
            try {
                const pct = await getDownPaymentAction();
                setDownPaymentPct(pct);
            } catch (error) {
                logger.error("Failed to load down payment", error);
            }
        }
        loadConfig();
    }, []);

    const handleTogglePreference = (pref: 'EMAIL' | 'WHATSAPP' | 'PHONE') => {
        if (state.contactPreferences.includes(pref)) {
            updateState({ contactPreferences: state.contactPreferences.filter(p => p !== pref) });
        } else {
            updateState({ contactPreferences: [...state.contactPreferences, pref] });
        }
    };

    const isFormValid = state.leadName.trim() !== '' &&
        state.leadEmail.trim() !== '' &&
        state.leadPhone.trim() !== '';

    const handleSubmit = async () => {
        setIsGenerating(true);
        try {
            const result = await submitQuoteSessionAction(state);
            if (result.success && result.data) {
                setSavedSession(result.data);
                setIsSubmitted(true);
            } else {
                logger.error("Error al generar cotización:", result.error);
                alert(result.error || "Ocurrió un error en el motor. Por favor intenta de nuevo.");
            }
        } catch (error) {
            logger.error("Unexpected error al generar cotización:", error);
            alert("Ocurrió un error inesperado. Por favor intenta de nuevo.");
        } finally {
            setIsGenerating(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    };

    if (isSubmitted && savedSession) {
        // Encontramos las 3 opciones comerciales calculadas por el Backend
        const ecoOpt = (savedSession.options || []).find(o => o.optionType === 'ECONOMICA') || { totalValue: 0 };
        const recOpt = (savedSession.options || []).find(o => o.optionType === 'RECOMENDADA') || { totalValue: 0 };
        const proOpt = (savedSession.options || []).find(o => o.optionType === 'PREMIUM') || { totalValue: 0 };

        return (
            <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-10">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">¡Tu cotización está lista!</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-10 max-w-lg">
                    Hemos preparado 3 opciones técnicas (Económica, Recomendada y Premium) basadas en las características de tu evento.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left mb-12">
                    {/* Variant 1 */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 relative overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer">
                        <div className="absolute top-0 inset-x-0 h-1 bg-neutral-200 dark:bg-neutral-700"></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">💰 Económica</span>
                        <div className="mt-4 mb-6">
                            <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(ecoOpt.totalValue)}</span>
                        </div>
                        <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 mb-8">
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5" /> Sonido estándar</li>
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5" /> Iluminación básica</li>
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-emerald-500 mr-2 mt-0.5" /> LED 10m²</li>
                        </ul>
                        <button className="w-full py-2.5 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-50 transition">Ver Detalle</button>
                    </div>

                    {/* Variant 2 (Recommended) */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-blue-600 shadow-lg p-6 relative overflow-hidden transform md:-translate-y-2">
                        <div className="absolute top-0 inset-x-0 h-1 bg-blue-600"></div>
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">✨ Recomendada</div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">⭐ Recomendada</span>
                        <div className="mt-4 mb-6">
                            <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(recOpt.totalValue)}</span>
                        </div>
                        <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 mb-8 font-medium">
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5" /> Sonido Line Array Pro</li>
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5" /> Iluminación completa</li>
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5" /> LED 20m² P3.9</li>
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5" /> Operadores incluidos</li>
                        </ul>
                        <button className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition flex items-center justify-center">Elegir Opción <ArrowRight className="w-4 h-4 ml-2" /></button>
                    </div>

                    {/* Variant 3 */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 relative overflow-hidden group hover:border-blue-300 transition-colors cursor-pointer">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">💎 Premium</span>
                        <div className="mt-4 mb-6">
                            <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(proOpt.totalValue)}</span>
                        </div>
                        <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400 mb-8">
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5" /> Sonido Premium Europeo</li>
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5" /> Iluminación Espectacular</li>
                            <li className="flex items-start"><CheckCircle className="w-4 h-4 text-purple-500 mr-2 mt-0.5" /> LED 40m² + Mapping</li>
                        </ul>
                        <button className="w-full py-2.5 rounded-lg border-2 border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-50 transition">Ver Detalle</button>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-left max-w-4xl w-full border border-blue-100 dark:border-blue-900/50 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-grow">
                        <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">🎯 Próximos Pasos</h4>
                        <ol className="list-decimal list-inside text-sm text-blue-800 dark:text-blue-300 space-y-1">
                            <li>Revisa los detalles PDF enviados a <span className="font-semibold">{state.leadEmail}</span>.</li>
                            <li><strong>Regla de Negocio:</strong> Confirma la fecha con un <strong className="text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 rounded">{downPaymentPct}% de anticipo</strong>.</li>
                            <li>Nos encargamos de toda la logística técnica.</li>
                        </ol>
                    </div>
                    <div className="flex-shrink-0 flex gap-3">
                        <button className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold flex items-center hover:bg-neutral-50 shadow-sm transition">
                            <FileText className="w-4 h-4 mr-2" /> PDF
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex-grow">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                    Solo falta que te conozcamos
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-8">
                    Ingresa tus datos para enviarte el enlace con las 3 cotizaciones inteligentes al instante.
                </p>

                <div className="max-w-2xl mx-auto space-y-5">
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre completo <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3"
                                    placeholder="Ej: Juan Pérez"
                                    value={state.leadName}
                                    onChange={e => updateState({ leadName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3"
                                        placeholder="tu@email.com"
                                        value={state.leadEmail}
                                        onChange={e => updateState({ leadEmail: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Teléfono <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3"
                                        placeholder="+56 9 1234 5678"
                                        value={state.leadPhone}
                                        onChange={e => updateState({ leadPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Company (Optional) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Empresa / Organización <span className="text-neutral-400 font-normal text-xs ml-1">(Opcional)</span></label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-3"
                                    placeholder="Ej: Producciones XYZ"
                                    value={state.leadCompany}
                                    onChange={e => updateState({ leadCompany: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Contact Preferences */}
                        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">¿Cómo prefieres ser contactado?</label>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { id: 'EMAIL', label: 'Email' },
                                    { id: 'WHATSAPP', label: 'WhatsApp' },
                                    { id: 'PHONE', label: 'Llamada' }
                                ].map(opt => (
                                    <label key={opt.id} className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            checked={state.contactPreferences.includes(opt.id as any)}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            onChange={() => handleTogglePreference(opt.id as any)}
                                        />
                                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </div>

                    <p className="text-xs text-center text-neutral-400">
                        🔒 Tu información está segura y se utiliza únicamente para el propósito del evento.
                    </p>
                </div>

            </div>

            {/* Footer / Actions */}
            <div className="pt-8 mt-8 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <button
                    onClick={onBack}
                    disabled={isGenerating}
                    className="px-6 py-3 rounded-xl font-bold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                    ◄ ANTERIOR
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isGenerating}
                    className={`flex items-center px-8 py-3 rounded-xl font-bold transition-all ${isFormValid ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            GENERANDO...
                        </>
                    ) : (
                        <>🎉 VER MI COTIZACIÓN</>
                    )}
                </button>
            </div>
        </div>
    );
}
